<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { configStorage, statsStorage, getConfig, setEnabled, resetStats } from '@/storage';
import type { FlackConfig, FlackStats } from '@/types';
import { getTrackerNames } from '@/trackers';

const enabled = ref(true);
const stats = ref<FlackStats>({
  trackersDetected: 0,
  fakeRequestsSent: 0,
  successfulRequests: 0,
  failedRequests: 0,
  byTracker: {},
  lastReset: Date.now(),
});

const trackerNames = getTrackerNames();

const poisonRatio = computed(() => {
  if (stats.value.trackersDetected === 0) return '0';
  return (stats.value.fakeRequestsSent / stats.value.trackersDetected).toFixed(1);
});

const trackerStats = computed(() => {
  return Object.entries(stats.value.byTracker)
    .map(([id, count]) => {
      const tracker = trackerNames.find((t) => t.id === id);
      return {
        id,
        name: tracker?.name || id,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);
});

onMounted(async () => {
  const config = await getConfig();
  enabled.value = config.enabled;

  stats.value = await statsStorage.getValue();

  // Watch for config changes
  configStorage.watch((newConfig: FlackConfig | null) => {
    if (newConfig) {
      enabled.value = newConfig.enabled;
    }
  });

  // Watch for stats changes
  statsStorage.watch((newStats: FlackStats | null) => {
    if (newStats) {
      stats.value = newStats;
    }
  });
});

async function toggleEnabled() {
  enabled.value = !enabled.value;
  await setEnabled(enabled.value);
}

function openOptions() {
  browser.runtime.openOptionsPage();
}

async function handleResetStats() {
  await resetStats();
  stats.value = await statsStorage.getValue();
}
</script>

<template>
  <div class="popup">
    <header>
      <div class="logo">
        <span class="logo-icon">F</span>
        <h1>Flack</h1>
      </div>
      <p class="tagline">Tracking Data Poisoner</p>
    </header>

    <div class="toggle-section">
      <button
        class="toggle-btn"
        :class="{ active: enabled }"
        @click="toggleEnabled"
      >
        <span class="toggle-indicator"></span>
      </button>
      <span class="toggle-label">{{ enabled ? 'Active' : 'Paused' }}</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ stats.trackersDetected }}</span>
        <span class="stat-label">Trackers Detected</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.fakeRequestsSent }}</span>
        <span class="stat-label">Fake Requests Sent</span>
      </div>
      <div class="stat-card highlight">
        <span class="stat-value">{{ poisonRatio }}x</span>
        <span class="stat-label">Poison Ratio</span>
      </div>
    </div>

    <div v-if="trackerStats.length > 0" class="tracker-breakdown">
      <h3>By Tracker</h3>
      <div class="tracker-list">
        <div
          v-for="tracker in trackerStats"
          :key="tracker.id"
          class="tracker-row"
        >
          <span class="tracker-name">{{ tracker.name }}</span>
          <span class="tracker-count">{{ tracker.count }}</span>
        </div>
      </div>
    </div>

    <footer>
      <button class="btn btn-secondary" @click="openOptions">Settings</button>
      <button class="btn btn-ghost" @click="handleResetStats">Reset Stats</button>
    </footer>
  </div>
</template>
