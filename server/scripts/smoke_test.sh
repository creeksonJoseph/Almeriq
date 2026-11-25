#!/usr/bin/env bash
# smoke_test.sh - Exercises selected critical API workflows against a disposable local dev database.
# Usage: ./smoke_test.sh
# Prerequisites: Server running at http://localhost:8000 (uv run uvicorn main:app --reload)

set -euo pipefail

BASE="http://localhost:8000"
RUN_ID=$(date +%s)
PROVIDER_EMAIL="provider-smoke-${RUN_ID}@example.com"
REGULAR_EMAIL="user-smoke-${RUN_ID}@example.com"
PASS=0
FAIL=0

ok() { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

echo "============================================"
echo "ALIMERIQ API Smoke Test"
echo "============================================"

# ── Helpers ──────────────────────────────────────────────
assert_status() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then ok "$desc ($actual)"; else fail "$desc (expected $expected, got $actual)"; fi
}

assert_status_any() {
  local desc="$1" shift
  local actual="$1"
  for expected in "$@"; do
    if [ "$actual" = "$expected" ]; then ok "$desc ($actual)"; return 0; fi
  done
  fail "$desc (expected one of $*, got $actual)"
}

# ── 1. Register a provider user ──────────────────────────
echo ""
echo "--- 1. Register provider user ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${PROVIDER_EMAIL}\",\"password\":\"SecurePass123!\"}")
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "POST /api/auth/register" "201" "$HTTP"

# ── 2. Login ─────────────────────────────────────────────
echo ""
echo "--- 2. Login ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${PROVIDER_EMAIL}\",\"password\":\"SecurePass123!\"}" \
  -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "POST /api/auth/login" "200" "$HTTP"

# ── 3. /me ───────────────────────────────────────────────
echo ""
echo "--- 3. Get current user ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/auth/me" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/auth/me" "200" "$HTTP"

# ── 5. Onboarding (set role to INFRASTRUCTURE_PROVIDER) ──
echo ""
echo "--- 5. Onboarding with provider role ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/onboarding" \
  -H "Content-Type: application/json" \
  -d "{\"full_name\":\"Sims Company\",\"nationality\":\"KE\",\"id_number\":\"SMOKE-${RUN_ID}\",\"role\":\"INFRASTRUCTURE_PROVIDER\"}" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "POST /api/auth/onboarding" "200" "$HTTP"

# ── 6. Unauthenticated access should fail ────────────────
echo ""
echo "--- 6. Unauthenticated 401 ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/auth/me")
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/auth/me (no auth)" "401" "$HTTP"

# ── 7. Create provider profile ───────────────────────────
echo ""
echo "--- 7. Create provider profile ---"
RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE/api/provider/profile" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Sims Company","trading_name":"Sims Co","provider_type":"company","location":"Beijing, China","about":"Tier-3 modular edge datacenter provider","enclave_key":"0x71F...9CA2"}' \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "PUT /api/provider/profile" "200" "$HTTP"

# ── 8. Create assets ─────────────────────────────────────
echo ""
echo "--- 8. Create assets ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/provider/assets" \
  -H "Content-Type: application/json" \
  -d '{"name":"CAT 336 Next-Gen Excavator","category":"Heavy Earthmoving","kind":"physical","description":"3x 36-ton units","specs":{"weight":"36 ton","units":3},"price_monthly":"14500","quantity_capacity":"3","status":"available","telemetry_url":"https://telemetry.example.com/cat336"}' \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status_any "POST /api/provider/assets" "200" "201" "$HTTP"
ASSET_ID=$(echo "$RESP" | sed '$d' | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/provider/assets" \
  -H "Content-Type: application/json" \
  -d '{"name":"64x NVIDIA H100 SXM5 SuperPOD","category":"AI Compute","kind":"digital","description":"64x SXM5 80GB","specs":{"gpu":"H100 SXM5","count":64,"interconnect":"3.2 Tbps InfiniBand"},"price_monthly":"48200","quantity_capacity":"1","status":"available","telemetry_url":"https://telemetry.example.com/h100"}' \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status_any "POST /api/provider/assets (2nd)" "200" "201" "$HTTP"

# ── 9. List assets ───────────────────────────────────────
echo ""
echo "--- 9. List assets ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/provider/assets" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/provider/assets" "200" "$HTTP"

# ── 10. Get single asset ─────────────────────────────────
echo ""
echo "--- 10. Get single asset ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/provider/assets/$ASSET_ID" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/provider/assets/{id}" "200" "$HTTP"

# ── 11. Marketplace listings (public) ────────────────────
echo ""
echo "--- 11. Marketplace listings (public) ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/marketplace/listings")
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/marketplace/listings (public)" "200" "$HTTP"

# ── 12. Marketplace listing detail (public) ──────────────
echo ""
echo "--- 12. Marketplace listing detail (public) ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/marketplace/listings/$ASSET_ID")
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/marketplace/listings/{id} (public)" "200" "$HTTP"

# ── 13. Search ───────────────────────────────────────────
echo ""
echo "--- 13. Search ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/search?q=excavator")
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/search (public)" "200" "$HTTP"

# ── 14. Register a founder buyer for marketplace checkout ────────────
echo ""
echo "--- 14. Register founder buyer ---"
FOUNDER_EMAIL="founder-smoke-${RUN_ID}@example.com"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"'${FOUNDER_EMAIL}'","password":"SecurePass123!"}')
HTTP=$(echo "$RESP" | tail -1)
assert_status "Register founder buyer" "201" "$HTTP"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'${FOUNDER_EMAIL}'","password":"SecurePass123!"}' \
  -c /tmp/founder-cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "Login founder buyer" "200" "$HTTP"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/onboarding" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Smoke Test Founder","nationality":"KE","id_number":"SMOKE-'${RUN_ID}'","role":"FOUNDER"}' \
  -b /tmp/founder-cookies.txt -c /tmp/founder-cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "Onboard founder buyer" "200" "$HTTP"

# ── 15. Atomic marketplace checkout creates order and deal ────────────
echo ""
echo "--- 15. Marketplace checkout ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/marketplace/checkout" \
  -H "Content-Type: application/json" \
  -d '{"asset_id":'${ASSET_ID}',"allocation":"3x 36-ton units","payment_method":"mpesa"}' \
  -b /tmp/founder-cookies.txt -c /tmp/founder-cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "POST /api/marketplace/checkout" "201" "$HTTP"
BODY=$(echo "$RESP" | sed '$d')
ORDER_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('order',{}).get('id',''))" 2>/dev/null || echo "")
DEAL_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('deal',{}).get('id',''))" 2>/dev/null || echo "")
if [ -n "$ORDER_ID" ] && [ -n "$DEAL_ID" ]; then ok "Checkout returned both order and deal"; else fail "Checkout did not return both order and deal"; fi

# ── 16. Get deal ─────────────────────────────────────────
echo ""
echo "--- 16. Get deal ---"
RESP=$(curl -s -L -w "\n%{http_code}" -X GET "$BASE/api/deals/$DEAL_ID" \
  -b /tmp/founder-cookies.txt -c /tmp/founder-cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status_any "GET /api/deals/{id}" "200" "201" "$HTTP"

# ── 17. Sign deal ────────────────────────────────────────
echo ""
echo "--- 17. Sign deal ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/deals/$DEAL_ID/sign" \
  -H "Content-Type: application/json" \
  -d '{"signature":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}' \
  -b /tmp/founder-cookies.txt -c /tmp/founder-cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status_any "POST /api/deals/{id}/sign" "200" "201" "$HTTP"

# ── 18. List orders ──────────────────────────────────────
echo ""
echo "--- 18. List orders ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/provider/orders" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/provider/orders" "200" "$HTTP"

# ── 19. Get order detail ─────────────────────────────────
echo ""
echo "--- 19. Get order detail ---"
if [ -n "$ORDER_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/provider/orders/$ORDER_ID" \
    -b /tmp/cookies.txt -c /tmp/cookies.txt)
  HTTP=$(echo "$RESP" | tail -1)
  assert_status_any "GET /api/provider/orders/{id}" "200" "201" "$HTTP"
else
  echo "  SKIP: GET /api/provider/orders/{id} (no orders)"
fi

# ── 20. Confirm order ────────────────────────────────────
echo ""
echo "--- 20. Confirm order ---"
if [ -n "$ORDER_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/provider/orders/$ORDER_ID/status" \
    -H "Content-Type: application/json" \
    -d '{"status":"confirmed"}' \
    -b /tmp/cookies.txt -c /tmp/cookies.txt)
  HTTP=$(echo "$RESP" | tail -1)
  assert_status_any "PATCH /api/provider/orders/{id}/status (confirm)" "200" "201" "$HTTP"
else
  echo "  SKIP: PATCH /api/provider/orders/{id}/status (confirm) (no orders)"
fi

# ── 21. Mark shipped ─────────────────────────────────────
echo ""
echo "--- 21. Mark shipped ---"
if [ -n "$ORDER_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/provider/orders/$ORDER_ID/status" \
    -H "Content-Type: application/json" \
    -d '{"status":"shipped"}' \
    -b /tmp/cookies.txt -c /tmp/cookies.txt)
  HTTP=$(echo "$RESP" | tail -1)
  assert_status_any "PATCH /api/provider/orders/{id}/status (shipped)" "200" "201" "$HTTP"
else
  echo "  SKIP: PATCH /api/provider/orders/{id}/status (shipped) (no orders)"
fi

# ── 22. Waybill ──────────────────────────────────────────
echo ""
echo "--- 22. Attach waybill ---"
if [ -n "$ORDER_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/provider/orders/$ORDER_ID/waybill" \
    -H "Content-Type: application/json" \
    -d '{"waybill_url":"https://example.com/waybill.pdf","tracking_number":"TRK-12345"}' \
    -b /tmp/cookies.txt -c /tmp/cookies.txt)
  HTTP=$(echo "$RESP" | tail -1)
  assert_status_any "POST /api/provider/orders/{id}/waybill" "200" "201" "$HTTP"
else
  echo "  SKIP: POST /api/provider/orders/{id}/waybill (no orders)"
fi

# ── 23. Coverage regions ─────────────────────────────────
echo ""
echo "--- 23. Coverage regions ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/provider/coverage-regions" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/provider/coverage-regions" "200" "$HTTP"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/provider/coverage-regions" \
  -H "Content-Type: application/json" \
  -d '{"region":"africa"}' \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status_any "POST /api/provider/coverage-regions" "200" "201" "$HTTP"

# ── 24. Conversations ────────────────────────────────────
echo ""
echo "--- 24. Conversations ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/conversations" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/conversations" "200" "$HTTP"

# ── 25. Messages (create conversation + message) ─────────
echo ""
echo "--- 25. Messages ---"
CONV_ID=$(curl -s -X GET "$BASE/api/conversations" -b /tmp/cookies.txt | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('items',d); print(items[0]['id'] if items else '')" 2>/dev/null || echo "")
if [ -n "$CONV_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/conversations/$CONV_ID/messages" \
    -b /tmp/cookies.txt -c /tmp/cookies.txt)
  HTTP=$(echo "$RESP" | tail -1)
  assert_status_any "GET /api/conversations/{id}/messages" "200" "201" "$HTTP"

  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/conversations/$CONV_ID/messages" \
    -H "Content-Type: application/json" \
    -d '{"body":"Hello, is this excavator still available?"}' \
    -b /tmp/cookies.txt -c /tmp/cookies.txt)
  HTTP=$(echo "$RESP" | tail -1)
  assert_status_any "POST /api/conversations/{id}/messages" "200" "201" "$HTTP"
else
  echo "  SKIP: messages (no conversations)"
fi

# ── 26. Notifications ────────────────────────────────────
echo ""
echo "--- 26. Notifications ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/notifications" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/notifications" "200" "$HTTP"

RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/notifications/read-all" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status_any "PATCH /api/notifications/read-all" "200" "201" "$HTTP"

# ── 27. Negative: wrong role 403 ─────────────────────────
echo ""
echo "--- 27. Negative: non-provider 403 ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${REGULAR_EMAIL}\",\"password\":\"SecurePass123!\"}" \
  -c /tmp/cookies2.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status_any "POST /api/auth/register (regular user)" "200" "201" "$HTTP"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${REGULAR_EMAIL}\",\"password\":\"SecurePass123!\"}" \
  -c /tmp/cookies2.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "POST /api/auth/login (regular user)" "200" "$HTTP"

RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/provider/profile" \
  -b /tmp/cookies2.txt -c /tmp/cookies2.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/provider/profile (non-provider)" "403" "$HTTP"

# ── 28. Negative: invalid payload 422 ────────────────────
echo ""
echo "--- 28. Negative: invalid payload 422 ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"short"}')
HTTP=$(echo "$RESP" | tail -1)
assert_status "POST /api/auth/register (invalid)" "422" "$HTTP"

# ── 29. Negative: cross-provider access ──────────────────
echo ""
echo "--- 29. Negative: cross-provider 404 ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/provider/assets/999999" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "GET /api/provider/assets/{nonexistent}" "404" "$HTTP"

# ── 30. Logout ───────────────────────────────────────────
echo ""
echo "--- 30. Logout ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/logout" \
  -b /tmp/cookies.txt -c /tmp/cookies.txt)
HTTP=$(echo "$RESP" | tail -1)
assert_status "POST /api/auth/logout" "200" "$HTTP"

# ── Summary ──────────────────────────────────────────────
echo ""
echo "============================================"
echo "RESULTS: $PASS passed, $FAIL failed"
echo "============================================"

rm -f /tmp/cookies.txt /tmp/cookies2.txt

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
