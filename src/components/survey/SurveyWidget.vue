<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from '@/i18n/useI18n'
import { useAnalytics } from '@/composables/useAnalytics'
import SurveyQuestion from './SurveyQuestion.vue'
import SurveyResults from './SurveyResults.vue'

// TODO: Replace with your actual Workers API URL after deployment
const API_BASE = 'https://ev-api.1481059602.workers.dev/api/v1'

const { t, locale } = useI18n()
const { sessionId } = useAnalytics()

const surveys = ref([])
const loading = ref(true)
const error = ref('')
const currentSurveyIndex = ref(0)
const selectedOptions = ref({})  // { surveyKey: optionId }
const submittedKeys = ref(new Set())

const currentSurvey = computed(() => {
  if (!surveys.value.length) return null
  return surveys.value[currentSurveyIndex.value]
})

const isLastSurvey = computed(() => {
  return currentSurveyIndex.value >= surveys.value.length - 1
})

const allSubmitted = computed(() => {
  return surveys.value.every(s => submittedKeys.value.has(s.key))
})

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/surveys?sessionId=${sessionId.value}`)
    if (!res.ok) throw new Error('Failed to fetch surveys')
    const data = await res.json()
    surveys.value = data.surveys

    // Mark already-voted surveys as submitted
    for (const s of data.surveys) {
      if (s.hasVoted) {
        submittedKeys.value.add(s.key)
      }
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

function selectOption(surveyKey, optionId) {
  selectedOptions.value[surveyKey] = optionId
}

async function submitVote(surveyKey) {
  const optionId = selectedOptions.value[surveyKey]
  if (!optionId) return

  try {
    const res = await fetch(`${API_BASE}/surveys/${surveyKey}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        optionId,
      }),
    })

    if (res.status === 409) {
      // Already voted — just mark as submitted
      submittedKeys.value.add(surveyKey)
      return
    }

    if (!res.ok) throw new Error('Vote failed')

    submittedKeys.value.add(surveyKey)

    // Update vote counts locally
    const survey = surveys.value.find(s => s.key === surveyKey)
    if (survey) {
      const opt = survey.options.find(o => o.id === optionId)
      if (opt) opt.voteCount++
      survey.totalVotes++
      survey.hasVoted = true
    }
  } catch (e) {
    console.error('Vote failed:', e)
  }
}

function nextSurvey() {
  if (currentSurveyIndex.value < surveys.value.length - 1) {
    currentSurveyIndex.value++
  }
}

function getLabel(option) {
  return locale.value === 'zh' ? option.label_zh : option.label_en
}

function getQuestion(survey) {
  return locale.value === 'zh' ? survey.question_zh : survey.question_en
}
</script>

<template>
  <div class="survey-widget">
    <!-- Loading state -->
    <div v-if="loading" class="survey-loading">
      <span class="loading-dot" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="survey-error">
      <p>{{ error }}</p>
    </div>

    <!-- All submitted: summary -->
    <div v-else-if="allSubmitted" class="survey-complete">
      <p class="complete-text">{{ t('survey.thankYou') }}</p>
      <div class="results-grid">
        <SurveyResults
          v-for="survey in surveys"
          :key="survey.key"
          :survey="survey"
          :get-label="getLabel"
          :get-question="getQuestion"
        />
      </div>
    </div>

    <!-- Active survey -->
    <div v-else-if="currentSurvey" class="survey-active">
      <div class="survey-header">
        <span class="survey-counter">{{ currentSurveyIndex + 1 }} / {{ surveys.length }}</span>
        <span class="survey-total">{{ t('survey.totalVotes', { count: currentSurvey.totalVotes }) }}</span>
      </div>

      <!-- Show results if this survey is already submitted -->
      <template v-if="submittedKeys.has(currentSurvey.key)">
        <SurveyResults
          :survey="currentSurvey"
          :get-label="getLabel"
          :get-question="getQuestion"
        />
        <button v-if="!isLastSurvey" class="survey-next-btn" @click="nextSurvey">
          {{ locale === 'zh' ? '下一题 →' : 'Next →' }}
        </button>
      </template>

      <!-- Show question -->
      <template v-else>
        <SurveyQuestion
          :question="getQuestion(currentSurvey)"
          :options="currentSurvey.options"
          :selected-id="selectedOptions[currentSurvey.key]"
          :get-label="getLabel"
          @select="(id) => selectOption(currentSurvey.key, id)"
        />
        <div class="survey-actions">
          <button
            class="submit-btn"
            :disabled="!selectedOptions[currentSurvey.key]"
            @click="submitVote(currentSurvey.key)"
          >
            {{ t('survey.submitVote') }}
          </button>
          <button
            v-if="!isLastSurvey && submittedKeys.has(currentSurvey.key)"
            class="next-btn"
            @click="nextSurvey"
          >
            {{ locale === 'zh' ? '下一题 →' : 'Next →' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.survey-widget {
  max-width: 520px;
  margin: 0 auto;
  padding: var(--space-5);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-lg);
}

.survey-loading {
  text-align: center;
  padding: var(--space-6);
}

.loading-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-coral);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.survey-error {
  text-align: center;
  padding: var(--space-4);
  color: rgba(255, 255, 255, 0.4);
  font-size: var(--font-size-small);
}

.survey-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.survey-counter {
  font-size: var(--font-size-caption);
  color: var(--color-coral);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.05em;
}

.survey-total {
  font-size: var(--font-size-caption);
  color: rgba(255, 255, 255, 0.4);
}

.survey-active {
  width: 100%;
}

.survey-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.submit-btn {
  flex: 1;
  padding: 10px 20px;
  background: var(--color-coral);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  opacity: 0.9;
}

.survey-next-btn,
.next-btn {
  padding: 10px 16px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: all 0.15s ease;
}

.survey-next-btn:hover,
.next-btn:hover {
  color: var(--color-coral);
  border-color: var(--color-coral);
}

.survey-complete {
  text-align: center;
}

.complete-text {
  font-size: var(--font-size-body);
  color: var(--color-coral);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-5);
}

.results-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
