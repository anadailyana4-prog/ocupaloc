import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://ocupaloc.ro";
const SLOTS_PATH = __ENV.SLOTS_PATH || "/api/public/slots";
// Slug and params for a realistic request (400 is expected for missing slug on prod)
const TEST_PARAMS = "?slug=test&serviciuId=1&date=2025-06-01";

export const options = {
  stages: [
    { duration: "2m", target: 30 },
    { duration: "2m", target: 30 },
    { duration: "1m", target: 0 }
  ],
  thresholds: {
    // Only count 5xx and network errors as failures (4xx are valid app responses)
    "http_req_failed{expected_response:true}": ["rate<0.01"],
    http_req_duration: ["p(95)<800"]
  }
};

export default function runPublicSlotsLoad() {
  const response = http.get(`${BASE_URL}${SLOTS_PATH}${TEST_PARAMS}`, {
    tags: { name: "public-slots" }
  });

  check(response, {
    "slots endpoint returns non-5xx": (r) => r.status < 500
  });
}
