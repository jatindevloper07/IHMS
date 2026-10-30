UI/UX
 
Specifications
 
Document
 
1.
 
Design
 
System
 
&
 
Principles
 
Design
 
Principles
 
1.
 
Clinical
 
Clarity
 
&
 
Safety
 
Alerts:
 
Visual
 
hierarchy
 
that
 
immediately
 
draws
 
attention
 
to
 
deteriorating
 
patient
 
vitals
 
and
 
critical
 
queue
 
changes.
 
2.
 
Micro-Stage
 
Transparency:
 
Reducing
 
patient
 
anxiety
 
by
 
visualizing
 
precise
 
steps
 
in
 
the
 
waiting
 
process
 
rather
 
than
 
static
 
countdown
 
timers.
 
3.
 
Actionable
 
Operations:
 
Providing
 
staff
 
with
 
automated,
 
single-click
 
recommendations
 
for
 
room
 
matching
 
and
 
surge
 
response.
 
Color
 
Palette
 
Category
 
Token
 
/
 
Color
 
Usage
 
Primary
 
#0F52BA
 
(Sapphire
 
Blue)
 
Navigation,
 
primary
 
action
 
buttons
 
Secondary
 
#00A896
 
(Teal)
 
Metrics,
 
success
 
states
 
Urgency
 
High
 
/
 
Alert
 
#D90429
 
(Crimson)
 
ESI
 
1-2
 
&
 
Active
 
Vitals
 
Deterioration
 
Alert
 
Urgency
 
Medium
 
#FF9F1C
 
(Amber)
 
ESI
 
3
 
/
 
Moderate
 
Delay
 
Warning
 
Urgency
 
Low
 
#2EC4B6
 
(Mint
 
Green)
 
ESI
 
4-5
 
/
 
Normal
 
Vitals
 
Neutral
 
Dark
 
#1E293B
 
(Slate
 
Dark)
 
Primary
 
typography,
 
headers
 
Neutral
 
Light
 
#F8FAFC
 
(Slate
 
Light)
 
Card
 
backgrounds,
 
canvas
 
 
2.
 
Key
 
User
 
Interfaces
 
&
 
Novel
 
Components
 
2.1
 
Patient
 
Mobile
 
Experience:
 
Micro-Wait
 
&
 
Dynamic
 
Re-Slotting
 
Main
 
View
 
Sections:
 
●
 
Live
 
Micro-Wait
 
Stage
 
Indicator:
 
●
 
Step
 
1:
 
Doctor
 
completing
 
consultation
 
with
 
prior
 
patient
 
(
~4
 
mins
)
 
●
 
Step
 
2:
 
Room
 
Sanitization
 
&
 
Equipment
 
Setup
 
(
~3
 
mins
)
 
●
 
Step
 
3:
 
Ready
 
for
 
Patient
 
Call
 
●
 
Vitals
 
&
 
Health
 
Pulse
 
Tracker:
 
Displays
 
connected
 
wristband
 
sync
 
status
 
(
Vitals
 
Stable
 
or
 
Tap
 
to
 
Report
 
Pain
 
Change
).
 
●
 
Smart
 
Delay
 
Assistant
 
Banner:
 
Appears
 
if
 
GPS
 
detects
 
traffic
 
delay:
 
"We
 
noticed
 
you're
 
stuck
 
in
 
traffic.
 
Would
 
you
 
like
 
to
 
shift
 
your
 
slot
 
by
 
20
 
mins
 
without
 
penalty?"
 
[Accept
 
Re-Slot]
 
[Keep
 
Slot]
.
 
2.2
 
Triage
 
Dashboard:
 
Vitals
 
Monitoring
 
&
 
Queue
 
Escalations
 
Features
 
&
 
Components:
 
●
 
Dynamic
 
Priority
 
Table:
 
●
 
Alert
 
Column:
 
Pulsing
 
Red
 
indicator
 
for
 
patients
 
with
 
triggered
 
$\Delta
 
V_{\text{deterioration}}$
 
scores.
 
●
 
Vitals
 
Trend
 
Mini-Chart:
 
Inline
 
Sparkline
 
showing
 
real-time
 
heart
 
rate
 
/
 
SpO2
 
trends
 
for
 
waiting
 
patients.
 
●
 
Manual
 
Override
 
Modal:
 
Allows
 
quick
 
triage
 
escalation
 
with
 
required
 
audit
 
logging
 
(
Vitals
 
Spike
,
 
Mobility
 
Issue
,
 
Doctor
 
Request
).
 
2.3
 
Resource
 
&
 
Equipment-Aware
 
Room
 
Management
 
Features
 
&
 
Components:
 
●
 
Interactive
 
Room
 
Matrix:
 
●
 
Display
 
tags
 
for
 
room
 
equipment
 
(e.g.,
 
[Ultrasound]
,
 
[ENT
 
Kit]
,
 
[ECG]
).
 
●
 
Turnover
 
Timer:
 
Displays
 
active
 
sanitization
 
countdowns.
 
●
 
Smart
 
Match
 
Suggestion
 
Banner:
 
"Room
 
104
 
(Ultrasound
 
ready)
 
cleaned.
 
Auto-assigning
 
highest
 
priority
 
patient:
 
Sarah
 
Jenkins
 
(ESI
 
2,
 
Needs
 
Ultrasound)."
 
[Confirm]
 
[Reassign]
.
 
2.4
 
Predictive
 
Capacity
 
&
 
Surge
 
Control
 
Center
 
Features
 
&
 
Components:
 
●
 
Surge
 
Probability
 
Heatmap:
 
Highlights
 
predicted
 
high-volume
 
hours
 
over
 
the
 
next
 
12
 
hours
 
based
 
on
 
ML
 
forecasts.
 
●
 
Staff
 
Re-allocation
 
Action
 
Card:
 
Automated
 
recommendation
 
panel:
 
"Predicted
 
ER
 
Surge
 
at
 
3:00
 
PM
 
(+45%
 
volume).
 
Recommended
 
action:
 
Reallocate
 
Dr.
 
Adams
 
from
 
Outpatient
 
Clinic
 
B
 
to
 
ER
 
Triage."
 
[Execute
 
Re-allocation]
.
 
 
None
 
None
 
3.
 
Key
 
Dynamic
 
User
 
Flows
 
Flow
 
1:
 
Real-Time
 
Patient
 
Deterioration
 
&
 
Queue
 
Re-ordering
 
[
 
IoT
 
Wristband
 
Detects
 
SpO2
 
Drop
 
/
 
Heart
 
Rate
 
Spike
 
]
 
                         
│
 
                         
▼
 
[
 
Microservice
 
Recalculates
 
Priority
 
Score
 
P(t)
 
]
 
                         
│
 
                         
▼
 
[
 
Patient
 
Moves
 
Up
 
in
 
Queue
 
Dashboard
 
+
 
Pulsing
 
Red
 
Alert
 
Flagged
 
]
 
                         
│
 
                         
▼
 
[
 
Triage
 
Nurse
 
Receives
 
Audio/Visual
 
Notification
 
on
 
Dashboard
 
]
 
                         
│
 
                         
▼
 
[
 
Immediate
 
Evaluation
 
/
 
Fast-Track
 
to
 
Consultation
 
Room
 
]
 
Flow
 
2:
 
Equipment-Aware
 
Room
 
Match
 
&
 
Sanitization
 
Lifecycle
 
[
 
Doctor
 
Concludes
 
Visit
 
&
 
Marks
 
Room
 
"Needs
 
Sanitization"
 
]
 
                         
│
 
                         
▼
 
[
 
Room
 
Status:
 
"Sanitization
 
Pending"
 
──►
 
Alert
 
Sent
 
to
 
Cleaning
 
Staff
 
]
 
                         
│
 
                         
▼
 
[
 
Cleaning
 
Staff
 
Taps
 
"Sanitization
 
Complete"
 
]
 
                         
│
 
                         
▼
 
[
 
Constraint
 
Solver
 
Matches
 
Patient
 
Equipment
 
Needs
 
+
 
Priority
 
Score
 
]
 
                         
│
 
                         
▼
 
[
 
Auto-Assignment
 
Prompt
 
Sent
 
to
 
Doctor
 
/
 
Call
 
Notification
 
to
 
Patient
 
]
 
 