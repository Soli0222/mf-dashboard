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
Reads from existingSecret or the auto-generated credentials secret.
*/}}
{{- define "mf-dashboard.databaseEnv" -}}
{{- $secretName := .Values.database.existingSecret | default (printf "%s-credentials" (include "mf-dashboard.fullname" .)) -}}
- name: POSTGRES_HOST
  valueFrom:
    secretKeyRef:
      name: {{ $secretName }}
      key: POSTGRES_HOST
- name: POSTGRES_PORT
  valueFrom:
    secretKeyRef:
      name: {{ $secretName }}
      key: POSTGRES_PORT
- name: POSTGRES_USER
  valueFrom:
    secretKeyRef:
      name: {{ $secretName }}
      key: POSTGRES_USER
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ $secretName }}
      key: POSTGRES_PASSWORD
- name: POSTGRES_DB
  valueFrom:
    secretKeyRef:
      name: {{ $secretName }}
      key: POSTGRES_DB
{{- end }}
