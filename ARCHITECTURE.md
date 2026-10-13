# AI Analysis Flow Architecture

## Overview
The AI analysis flow is a critical path that converts founder input into actionable startup insights using Google Gemini AI. This document outlines the professional-grade architecture, error handling, data flow, and comprehensive logging strategy.

## System Architecture

### Frontend Flow
```
FounderIntakePage (Form Input)
    ↓
useFounderFlow Hook (State Management)
    ↓
API Call (analyzeFounderIdeaApi)
    ↓
FounderAnalysisPage (Display Results)
    ↓
FounderRoadmapPage (Action Items)
```

### Backend Flow
```
POST /founder/analyze
    ↓
FounderAnalysisRequest Validation (Pydantic)
    ↓
analyze_founder_idea() Service
    ↓
Gemini API Request
    ↓
Response Parsing & Validation
    ↓
Database Persistence
    ↓
FounderAnalysisResponse
```

## Data Persistence Strategy

### Session Layer (Frontend)
- **sessionStorage**: Temporary form state during active session
- **localStorage**: Venture ID reference for recovery
- **Purpose**: Enable quick navigation without re-fetching

### Database Layer (Backend)
- **Primary**: All analysis results persisted to PostgreSQL
- **Venture table**: Stores brief + analysis together
- **Purpose**: Single source of truth, enables multi-session access

### Recovery Flow
1. User closes browser → sessionStorage cleared
2. User returns → Check localStorage for venture_id
3. If venture_id exists → Fetch from database
4. If not → Start fresh flow

## Error Handling Strategy

### Gemini API Errors
All errors from Gemini are cleaned and presented to user:
- **Rate Limit (429)**: "Service is busy. Please try again in 30 seconds."
- **Timeout**: "Analysis took too long. Please try again."
- **Invalid Response**: "Unable to parse analysis. Please try again."
- **Network Error**: "Connection failed. Please check your internet and try again."

**No fallback analysis** - Users see real errors, not generic placeholders.

### Validation Errors
- **Request validation**: Return 422 with field-specific errors
- **Response validation**: Return 500 with "Analysis format error"
- **Database errors**: Return 500 with "Unable to save analysis"

### Frontend Error Boundaries
- Wrap analysis pages in error boundary
- Show user-friendly error with retry button
- Preserve form state for retry

## Request/Response Validation

### Backend Validation (Pydantic)
```python
class FounderAnalysisRequest(BaseModel):
    idea: str = Field(..., min_length=10, max_length=500)
    problem: str = Field(..., min_length=10, max_length=500)
    solution: str = Field(..., min_length=10, max_length=500)
    customer: str = Field(..., min_length=2, max_length=200)
    location: str = Field(..., min_length=2, max_length=200)
```

### Frontend Response Validation (Zod)
```typescript
const analysisSchema = z.object({
  source: z.enum(['gemini', 'local']),
  summary: z.string().min(20).max(2000),
  market: z.string().min(20).max(2000),
  risks: z.array(z.string()).min(3).max(7),
  mvp: z.array(z.string()).min(3).max(7),
  roadmap: z.array(z.string()).min(3).max(8),
  next_steps: z.array(z.string()).min(3).max(8),
  venture_id: z.number().optional(),
});
```

## State Management

### useFounderFlow Hook
- **form**: Current form state (synced to sessionStorage)
- **analysis**: Analysis results (synced to sessionStorage)
- **ventureId**: Saved venture reference (synced to localStorage)
- **loading**: Request in progress
- **error**: User-facing error message
- **saveSuccess**: Confirmation of database persistence

### Debouncing
- Analyze button: Debounced 500ms to prevent double-submission
- Form changes: Debounced 1s before sessionStorage sync

## API Integration

### Request Flow
1. Validate form locally (Zod)
2. Debounce submit
3. POST to /founder/analyze
4. Handle response or error
5. Persist to sessionStorage + localStorage
6. Navigate to analysis page

### Error Handling
```typescript
try {
  const result = await analyzeFounderIdeaApi(form);
  setAnalysis(result);
  setVentureId(result.venture_id);
  setSaveSuccess(true);
} catch (err) {
  const cleanedError = cleanGeminiError(err.message);
  setError(cleanedError);
  throw err; // Re-throw for error boundary
}
```

## Gemini Integration

### Prompt Strategy
- **Concise prompts**: Avoid HTTP 400 errors from oversized payloads
- **Tool-specific prompts**: Each deliverable gets optimized prompt
- **JSON mode**: Force structured output with `responseMimeType: "application/json"`

### Timeout Handling
- Request timeout: 25 seconds for analysis, 30 seconds for tools
- If timeout → Clean error message
- No retry (user can retry manually)

### Response Parsing
1. Extract text from Gemini response
2. Remove markdown code blocks if present
3. Parse JSON
4. Validate against schema
5. Return or throw error

## Database Persistence

### Venture Record
```sql
CREATE TABLE ventures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  idea TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  customer TEXT NOT NULL,
  location TEXT NOT NULL,
  source VARCHAR(20),
  summary TEXT,
  market TEXT,
  risks JSONB,
  mvp JSONB,
  roadmap JSONB,
  next_steps JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Persistence Flow
1. Analysis completes successfully
2. Backend saves venture + analysis to DB
3. Return venture_id in response
4. Frontend stores venture_id in localStorage
5. User can access venture from dashboard

## Error Message Cleaning

### Gemini Error Patterns
```python
def clean_gemini_error(error_message: str) -> str:
    """Convert technical errors to user-friendly messages."""
    if "429" in error_message or "quota" in error_message.lower():
        return "Service is busy. Please try again in 30 seconds."
    if "timeout" in error_message.lower():
        return "Analysis took too long. Please try again."
    if "json" in error_message.lower():
        return "Unable to parse analysis. Please try again."
    if "connection" in error_message.lower():
        return "Connection failed. Please check your internet and try again."
    if "invalid" in error_message.lower():
        return "Invalid response from AI. Please try again."
    return "Unable to complete analysis. Please try again."
```

## Logging Strategy

### Backend Logging (Python logging)
All logs are sent to stdout/stderr and visible in Render logs.

#### Service Layer (`services/founder.py`)
- **INFO**: Analysis start, completion, tool generation
- **DEBUG**: API URLs, payload sizes
- **ERROR**: HTTP errors, timeouts, parsing errors with elapsed time
- **WARNING**: Cleaned errors returned to user

Example logs:
```
INFO: Starting Gemini analysis request
  idea_length: 150
  customer: "Freight forwarders"
  location: "Nairobi"

INFO: Gemini analysis completed successfully
  elapsed_seconds: 3.45

ERROR: Gemini HTTP error: 429 Too Many Requests
  status_code: 429
  elapsed_seconds: 0.12
```

#### Router Layer (`api/routers/founder.py`)
- **INFO**: Endpoint calls with user_id, parameters, elapsed time
- **WARNING**: Authorization failures, resource not found
- **ERROR**: Service errors, unexpected exceptions with stack trace
- **DEBUG**: Cache hits, database operations

Example logs:
```
INFO: POST /founder/analyze
  user_id: 42
  idea_length: 150
  customer: "Freight forwarders"

INFO: Analysis completed successfully
  user_id: 42
  elapsed_seconds: 3.67
  source: "gemini"

INFO: Venture saved to database
  user_id: 42
  venture_id: 123

ERROR: Analysis failed with cleaned error: Service is busy. Please try again in 30 seconds.
  user_id: 42
  elapsed_seconds: 0.15
```

### Frontend Logging (Console)
All logs prefixed with `[useFounderFlow]` for easy filtering.

#### Hook Initialization
```
[useFounderFlow] Initialized form from sessionStorage
  hasData: true
  ideaLength: 150

[useFounderFlow] Initialized analysis from sessionStorage
  hasData: true
  source: "gemini"

[useFounderFlow] Initialized ventureId from localStorage
  ventureId: 123
```

#### Analysis Request
```
[useFounderFlow] Starting analysis request
  ideaLength: 150
  customerLength: 20

[useFounderFlow] API response received
  elapsedMs: 3456
  source: "gemini"
  risksCount: 5
  ventureId: 123

[useFounderFlow] Response validation passed

[useFounderFlow] Venture saved successfully
  ventureId: 123
```

#### Error Handling
```
[useFounderFlow] Analysis failed
  elapsedMs: 150
  errorType: "APIError"
  errorMessage: "Service is busy. Please try again in 30 seconds."

[useFounderFlow] Validation error details
  errors: [{ code: "too_small", minimum: 20, ... }]
```

#### State Management
```
[useFounderFlow] Form synced to sessionStorage
  ideaLength: 150

[useFounderFlow] Analysis saved to sessionStorage
  source: "gemini"
  risksCount: 5

[useFounderFlow] Venture ID saved to localStorage
  ventureId: 123

[useFounderFlow] Resetting flow
[useFounderFlow] Flow reset complete
```

### Monitoring in Render

1. **View logs**: Render dashboard → Logs tab
2. **Filter by service**: Backend logs show all Python logging
3. **Search patterns**:
   - `"Analysis completed successfully"` - Successful analyses
   - `"HTTP error"` - Gemini API failures
   - `"Venture saved to database"` - Successful persistence
   - `"Analysis failed"` - User-facing errors

### Performance Metrics from Logs

Extract from logs:
- **Analysis time**: `elapsed_seconds` field
- **Error rate**: Count of ERROR logs vs INFO logs
- **Cache hit rate**: Count of "served from cache" vs "generated"
- **Timeout rate**: Count of timeout errors

## Performance Considerations

### Caching
- **Gemini responses**: Cached in Redis (if available)
- **Cache key**: Hash of (user_id, idea, problem, solution, customer, location)
- **TTL**: 7 days
- **Bypass**: User can force refresh with `refresh: true` param

### Request Optimization
- **Debouncing**: Prevent rapid-fire requests
- **Timeout**: 25s max to avoid hanging
- **Async**: Non-blocking on backend

## Security

### Input Validation
- All inputs validated with Pydantic
- Character limits enforced (500 chars max for idea/problem/solution)
- SQL injection prevention via ORM

### Output Sanitization
- Gemini responses validated before storage
- No HTML/script injection possible (JSON only)
- User data isolated by user_id

## Future Improvements

1. **Streaming responses**: Stream analysis as it's generated
2. **Retry logic**: Exponential backoff for transient failures
3. **Analytics**: Track which analysis sections are most useful
4. **Versioning**: Support multiple analysis versions per venture
5. **Collaboration**: Share analysis with co-founders
6. **Export**: PDF/Markdown export of full analysis
7. **Structured logging**: Move to JSON logging for better parsing
8. **Metrics collection**: Prometheus metrics for monitoring
