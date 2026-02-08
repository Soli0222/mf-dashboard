{{/*
Expand the name of the chart.
*/}}
{{- define "mf-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "mf-dashboard.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "mf-dashboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mf-dashboard.labels" -}}
helm.sh/chart: {{ include "mf-dashboard.chart" . }}
{{ include "mf-dashboard.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "mf-dashboard.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mf-dashboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Database environment variables (POSTGRES_*)
Host, port, user, db are set as plain values.
Password is read from existingSecret or the auto-generated database secret.
*/}}
{{- define "mf-dashboard.databaseEnv" -}}
- name: POSTGRES_HOST
  value: {{ .Values.database.host | quote }}
- name: POSTGRES_PORT
  value: {{ .Values.database.port | default "5432" | quote }}
- name: POSTGRES_USER
  value: {{ .Values.database.user | quote }}
- name: POSTGRES_DB
  value: {{ .Values.database.name | quote }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      {{- if .Values.database.existingSecret.name }}
      name: {{ .Values.database.existingSecret.name }}
      key: {{ .Values.database.existingSecret.passwordKey | default "password" }}
      {{- else }}
      name: {{ include "mf-dashboard.fullname" . }}-database
      key: POSTGRES_PASSWORD
      {{- end }}
{{- end }}
