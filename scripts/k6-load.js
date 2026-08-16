import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

const API = __ENV.API_URL || "http://localhost:4000";

export default function () {
  const health = http.get(`${API}/health`);
  check(health, { "health 200": (r) => r.status === 200 });

  const ready = http.get(`${API}/ready`);
  check(ready, { "ready 200": (r) => r.status === 200 });

  sleep(1);
}
