# Database Schema

## profiles

| Column | Type | Rules |
|---|---|---|
| id | uuid | PK, references auth.users.id |
| name | text | required |
| email | text | required, unique |
| phone | text | required |
| branch | text | required |
| year | text | default `1st Year` |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

## quiz_questions

| Column | Type | Rules |
|---|---|---|
| id | uuid | PK |
| category | text | `HTML`, `CSS`, or `JavaScript` |
| question_text | text | required |
| options | jsonb | exactly 4 options |
| correct_option | integer | 0 to 3, server-only access |
| explanation | text | optional |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

## quiz_attempts

| Column | Type | Rules |
|---|---|---|
| id | uuid | PK |
| profile_id | uuid | unique FK to profiles.id |
| status | text | `started` or `completed` |
| started_at | timestamptz | required |
| submitted_at | timestamptz | nullable |
| html_score | integer | 0 to 10 |
| css_score | integer | 0 to 10 |
| javascript_score | integer | 0 to 10 |
| total_score | integer | 0 to 30 |
| percentage | numeric | 0 to 100 |
| certificate_eligible | boolean | server calculated |

The unique `profile_id` ensures one attempt per participant.

## quiz_answers

| Column | Type | Rules |
|---|---|---|
| id | uuid | PK |
| attempt_id | uuid | FK to quiz_attempts.id |
| question_id | uuid | FK to quiz_questions.id |
| selected_option | integer | 0 to 3 |
| created_at | timestamptz | default now() |

Add a unique constraint on `(attempt_id, question_id)`.

## certificates

| Column | Type | Rules |
|---|---|---|
| id | uuid | PK |
| profile_id | uuid | FK to profiles.id |
| attempt_id | uuid | FK to quiz_attempts.id |
| certificate_number | text | unique |
| file_path | text | nullable until generated |
| status | text | `eligible`, `generated`, `sent`, `failed` |
| sent_at | timestamptz | nullable |
| sent_by | uuid | FK to auth.users.id, nullable |
| created_at | timestamptz | default now() |

## admin_users

| Column | Type | Rules |
|---|---|---|
| user_id | uuid | PK, references auth.users.id |
| role | text | `admin` |
| created_at | timestamptz | default now() |
