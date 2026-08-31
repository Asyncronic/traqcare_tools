import http from "k6/http";

const imeis = JSON.parse(__ENV.IMEIS);
const bodyTemplate = JSON.parse(JSON.parse(__ENV.BODY_TEMPLATE));
const simulation = JSON.parse(__ENV.SIMULATION);
const cpuCount = Number(__ENV.CPU_COUNT);

function getTargetUrl(imei) {
  const lastDigit = Number(String(imei).slice(-1));

  const workerId = lastDigit % cpuCount;

  // return `http://localhost:${5500 + workerId}/api/pushData`;
  return `http://localhost:5500/api/pushData`;
}

export const options = {
  scenarios: {
    gps: {
      executor: "constant-arrival-rate",
      rate: imeis?.length,
      timeUnit: "1s",
      duration: __ENV.DURATION,
      preAllocatedVUs: 100,
      maxVUs: 100000,
    },
  },
};

const deviceState = {};

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createState(imei) {
  return {
    imei,
    latitude: bodyTemplate?.newObject?.latitude,
    longitude: bodyTemplate?.newObject?.longitude,
    speed: simulation.speed ?? 20,
    acc: simulation.ignition ?? true,
    lastSpeedChange: Date.now(),
    lastIgnitionChange: Date.now(),
  };
}

let imeiIndex = 0;

export default function () {
  const imei = imeis[imeiIndex];

  imeiIndex++;

  if (imeiIndex >= imeis.length) imeiIndex = 0;

  if (!deviceState[imei]) deviceState[imei] = createState(imei);

  const state = deviceState[imei];

  const now = Date.now();

  //----------------------------------------------------
  // Dynamic Speed
  //----------------------------------------------------

  if (simulation.dynamicSpeed) {
    if (now - state.lastSpeedChange >= simulation.speedInterval * 1000) {
      state.speed = random(simulation.minSpeed, simulation.maxSpeed);

      state.lastSpeedChange = now;
    }
  }

  //----------------------------------------------------
  // Dynamic Ignition
  //----------------------------------------------------

  if (simulation.dynamicIgnition) {
    if (now - state.lastIgnitionChange >= simulation.ignitionInterval * 1000) {
      state.acc = !state.acc;
      state.lastIgnitionChange = now;
    }
  }

  //----------------------------------------------------
  // GPS Movement
  //----------------------------------------------------
  if (state.acc || state.speed > 3) {
    state.latitude += 0.001;
    state.longitude += 0.001;
    state.protocolName = 'ping'
  }

  //----------------------------------------------------
  // Payload
  //----------------------------------------------------

  const payload = bodyTemplate;

  payload.newObject.deviceId = imei;
  payload.newObject.latitude = state.latitude;
  payload.newObject.longitude = state.longitude;
  payload.newObject.speed = state.speed;
  payload.newObject.acc = state.acc;
  payload.newObject.device_time = new Date().toISOString();
  payload.newObject.server_time = new Date().toISOString();

  let target = getTargetUrl(imei);
  http.post(target, JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function handleSummary(data) {
  return {
    "./k6-summary.json": JSON.stringify(data),
  };
}
