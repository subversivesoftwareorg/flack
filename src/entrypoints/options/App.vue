<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { getConfig, setConfig, resetConfig } from '@/storage';
import { getTrackerNames } from '@/trackers';
import type { FlackConfig } from '@/types';

const config = ref<FlackConfig | null>(null);
const saved = ref(false);
const trackers = getTrackerNames();

onMounted(async () => {
  config.value = await getConfig();
});

watch(
  config,
  async (newConfig) => {
    if (newConfig) {
      await setConfig(newConfig);
      showSaved();
    }
  },
  { deep: true }
);

function showSaved() {
  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 1500);
}

function toggleTracker(trackerId: string) {
  if (!config.value) return;

  const index = config.value.enabledTrackers.indexOf(trackerId);
  if (index === -1) {
    config.value.enabledTrackers.push(trackerId);
  } else {
    config.value.enabledTrackers.splice(index, 1);
  }
}

function isTrackerEnabled(trackerId: string): boolean {
  return config.value?.enabledTrackers.includes(trackerId) ?? false;
}

async function handleReset() {
  if (confirm('Reset all settings to defaults?')) {
    await resetConfig();
    config.value = await getConfig();
  }
}
</script>

<template>
  <div class="options-page">
    <header>
      <div class="logo">
        <span class="logo-icon">F</span>
        <h1>Flack Settings</h1>
      </div>
      <span v-if="saved" class="saved-indicator">Saved</span>
    </header>

    <main v-if="config">
      <section>
        <h2>Flooding Behavior</h2>
        <p class="section-desc">
          Configure how many fake requests are sent per detected tracker.
        </p>

        <div class="option-group">
          <label>Fake requests per tracker</label>
          <div class="range-inputs">
            <div class="input-wrapper">
              <span class="input-label">Min</span>
              <input
                type="number"
                v-model.number="config.flood.minFakeRequests"
                min="1"
                max="50"
              />
            </div>
            <span class="range-separator">to</span>
            <div class="input-wrapper">
              <span class="input-label">Max</span>
              <input
                type="number"
                v-model.number="config.flood.maxFakeRequests"
                min="1"
                max="50"
              />
            </div>
          </div>
        </div>

        <div class="option-group">
          <label>Delay between requests (ms)</label>
          <div class="range-inputs">
            <div class="input-wrapper">
              <span class="input-label">Min</span>
              <input
                type="number"
                v-model.number="config.flood.minDelayMs"
                min="50"
                max="5000"
                step="50"
              />
            </div>
            <span class="range-separator">to</span>
            <div class="input-wrapper">
              <span class="input-label">Max</span>
              <input
                type="number"
                v-model.number="config.flood.maxDelayMs"
                min="50"
                max="5000"
                step="50"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Enabled Trackers</h2>
        <p class="section-desc">
          Choose which tracking services to poison with fake data.
        </p>

        <div class="tracker-grid">
          <div
            v-for="tracker in trackers"
            :key="tracker.id"
            class="tracker-toggle"
            :class="{ active: isTrackerEnabled(tracker.id) }"
            @click="toggleTracker(tracker.id)"
          >
            <span class="checkbox">
              <span v-if="isTrackerEnabled(tracker.id)" class="checkmark">&#10003;</span>
            </span>
            <span class="tracker-name">{{ tracker.name }}</span>
          </div>
        </div>
      </section>

      <section>
        <h2>Rate Limiting</h2>
        <p class="section-desc">
          Prevent detection by limiting how many fake requests are sent.
        </p>

        <div class="option-group">
          <label>Max requests per minute (per tracker)</label>
          <input
            type="number"
            v-model.number="config.rateLimit.maxRequestsPerMinute"
            min="1"
            max="100"
          />
        </div>

        <div class="option-group">
          <label>Global max per minute</label>
          <input
            type="number"
            v-model.number="config.rateLimit.globalMaxPerMinute"
            min="1"
            max="500"
          />
        </div>
      </section>

      <section class="future-section">
        <h2>Custom Profiles</h2>
        <p class="section-desc">
          Coming soon: Create custom user profiles for more targeted data poisoning.
          Register personas with specific demographics, interests, and behaviors.
        </p>
        <div class="coming-soon-badge">Coming Soon</div>
      </section>

      <footer>
        <button class="btn btn-danger" @click="handleReset">
          Reset to Defaults
        </button>
      </footer>
    </main>
  </div>
</template>
