None
 
Technical
 
Approach
 
&
 
Architecture
 
Document
 
1.
 
System
 
Architecture
 
Overview
 
The
 
Intelligent
 
Hospital
 
Management
 
System
 
(IHMS)
 
utilizes
 
an
 
event-driven
 
microservices
 
architecture
 
designed
 
for
 
real-time
 
responsiveness,
 
predictive
 
analytics,
 
and
 
seamless
 
integration
 
between
 
wearable/vital
 
inputs,
 
patient
 
applications,
 
ML
 
pipelines,
 
and
 
operational
 
dashboards.
 
 
[
 
Patient
 
App
 
/
 
IoT
 
Vitals
 
]
          
[
 
Staff
 
/
 
Admin
 
Dashboard
 
]
 
                 
\
                              
/
 
                  
\
                            
/
 
         
+----------------------------------------------+
 
         
|
               
API
 
Gateway
 
/
 
WebSocket
        
|
 
         
+----------------------------------------------+
 
                                
|
 
         
+----------------------+----------------------+
 
         
|
                      
|
                      
|
 
[
 
Appointment
 
&
 
Delay
 
]
  
[
 
Queue
 
&
 
Triage
 
]
    
[
 
IoT
 
/
 
Vitals
 
Stream
 
]
 
    
Re-Slot
 
Service
          
Service
               
Ingestion
 
Pipeline
 
         
|
                      
|
                      
|
 
         
+----------------------+----------------------+
 
                                
|
 
             
+------------------+------------------+
 
             
|
 
Dynamic
 
Queue
 
&
 
Priority
 
Engine
     
|
 
             
|
 
(Vitals
 
Deterioration
 
&
 
ESI)
        
|
 
             
+------------------+------------------+
 
                                
|
 
             
+------------------+------------------+
 
             
|
 
ML
 
Inference
 
Engine
                 
|
 
             
|
 
-
 
Wait-Time
 
&
 
Duration
 
Predictor
    
|
 
             
|
 
-
 
Predictive
 
Surge
 
Model
            
|
 
             
+------------------+------------------+
 
                                
|
 
             
+------------------+------------------+
 
             
|
 
Resource
 
&
 
Equipment
 
Matching
 
Engine|
 
             
+------------------+------------------+
 
                                
|
 
             
+------------------+------------------+
 
             
|
        
Database
 
/
 
State
 
Store
       
|
 
             
|
   
(PostgreSQL
 
+
 
Redis
 
Cache/PubSub)
 
|
 
             
+-------------------------------------+
 
 
2.
 
Dynamic
 
Priority
 
Engine
 
&
 
Mathematical
 
Formulation
 
To
 
incorporate
 
real-time
 
patient
 
vital
 
sign
 
deterioration
 
alongside
 
clinical
 
urgency
 
(
)
 
and
 𝐸𝑆𝐼
elapsed
 
wait
 
time,
 
the
 
dynamic
 
priority
 
index
 
 
for
 
a
 
patient
 
at
 
time
 
 
is
 
calculated
 
as:
 𝑃 ( 𝑡 ) 𝑡
$$
 
P(t)
 
=
 
w_1
 
\cdot
 
U_{\text{clinical}}
 
+
 
w_2
 
\cdot
 
T_{\text{elapsed}}
 
+
 
w_3
 
\cdot
 
\Delta
 
V_{\text{deterioration}}
 
$$
 
 
Where:
 
●
 
$U_{\text{clinical}}
 
=
 
\frac{6
 
-
 
ESI}{5}$
:
 
Base
 
urgency
 
score
 
derived
 
from
 
initial
 
Emergency
 
Severity
 
Index
 
(
).
 1 ≤ 𝐸𝑆𝐼 ≤ 5
●
 
$T_{\text{elapsed}}
 
=
 
\min\left(1,
 
\frac{t
 
-
 
t_{\text{checkin}}}{T_{\text{max\_wait}}}\right)$
:
 
Normalized
 
time
 
spent
 
waiting
 
to
 
prevent
 
queue
 
starvation.
 
●
 
$\Delta
 
V_{\text{deterioration}}
 
=
 
f(\text{HR},
 
\text{SpO}_2,
 
\text{Pain
 
Rating})$
:
 
Real-time
 
deterioration
 
score
 
calculated
 
by
 
comparing
 
streamed
 
IoT/self-reported
 
vitals
 
against
 
normal
 
baseline
 
thresholds.
 
If
 
an
 
anomaly
 
is
 
detected,
 
$\Delta
 
V_{\text{deterioration}}
 
\in
 
(0,
 
1.0]$
 
immediately
 
escalates
 
 
and
 
triggers
 
an
 
automated
 
triage
 
alert.
 𝑃 ( 𝑡 )
●
 
:
 
Weight
 
hyperparameters
 
(e.g.,
 
,
 
,
 
).
 𝑤 1 , 𝑤 2 , 𝑤 3 𝑤 1 = 0 . 5 𝑤 2 = 0 . 2 𝑤 3 = 0 . 3
 
3.
 
Innovative
 
Feature
 
Technical
 
Implementation
 
3.1
 
IoT
 
Vitals
 
Ingestion
 
&
 
Deterioration
 
Pipeline
 
●
 
Tech
 
Stack:
 
MQTT
 
Broker
 
/
 
WebSockets
 
 
Redis
 
TimeSeries
 
 
Anomaly
 
Detection
 → →
Microservice.
 
●
 
Mechanism:
 
Ingests
 
heart
 
rate,
 
SpO2,
 
and
 
temperature
 
readings
 
from
 
smart
 
wristbands
 
every
 
30
 
seconds.
 
If
 
parameters
 
deviate
 
beyond
 
safety
 
thresholds,
 
the
 
microservice
 
updates
 
the
 
patient's
 
$\Delta
 
V_{\text{deterioration}}$
 
score
 
in
 
Redis,
 
triggering
 
a
 
re-sort
 
of
 
the
 
live
 
queue
 
and
 
issuing
 
a
 
WebSocket
 
event
 
to
 
the
 
Triage
 
Nurse
 
Dashboard.
 
3.2
 
Equipment
 
&
 
Specialty-Aware
 
Resource
 
Matching
 
Engine
 
●
 
Constraint
 
Solver
 
Matrix:
 
Uses
 
constraint
 
satisfaction
 
algorithms
 
(e.g.,
 
OR-Tools
 
or
 
custom
 
heuristic
 
matching)
 
based
 
on
 
patient
 
diagnostic
 
tags,
 
doctor
 
capabilities,
 
and
 
room
 
equipment
 
tags.
 
●
 
Logic:
 
$$\text{Match}(P_i,
 
R_j)
 
=
 
\text{IsAvailable}(R_j)
 
\land
 
\text{IsCleaned}(R_j)
 
\land
 
(\text{ReqEquipment}(P_i)
 
\subseteq
 
\text{Equipped}(R_j))$$
 
When
 
a
 
room
 
transitions
 
to
 
Cleaned
,
 
the
 
solver
 
immediately
 
assigns
 
the
 
highest
 
priority
 
patient
 
 
whose
 
medical
 
requirements
 
fit
 𝑃 𝑖
room
 
.
 𝑅 𝑗
3.3
 
Dynamic
 
Micro-Wait
 
Stage
 
Tracker
 
●
 
Pipeline:
 
Breakdown
 
of
 
total
 
predicted
 
wait
 
$T_{\text{wait}}$
 
into
 
discrete
 
state
 
machines:
 
$$T_{\text{wait}}
 
=
 
T_{\text{current\_consult\_finish}}
 
+
 
T_{\text{sanitization}}
 
+
 
T_{\text{prep}}$$
 
●
 
Real-time
 
state
 
transitions
 
emitted
 
via
 
Server-Sent
 
Events
 
(SSE)
 
to
 
patient
 
mobile
 
client.
 
3.4
 
Predictive
 
Surge
 
&
 
Capacity
 
Engine
 
●
 
Model:
 
Time-series
 
forecasting
 
(Prophet
 
/
 
Temporal
 
Fusion
 
Transformer)
 
trained
 
on
 
historical
 
arrival
 
data,
 
combined
 
with
 
external
 
weather
 
and
 
local
 
traffic
 
API
 
triggers.
 
●
 
Output:
 
Generates
 
hourly
 
patient
 
surge
 
probabilities
 
 
and
 
triggers
 𝑆 ℎ ∈ [ 0 , 1 ]
recommended
 
staff
 
shift
 
re-allocations
 
when
 
.
 𝑆 ℎ > 0 . 85
3.5
 
Automated
 
GPS
 
Delay
 
&
 
Re-Slotting
 
Service
 
●
 
Trigger:
 
Patient
 
opt-in
 
geofencing
 
/
 
ETA
 
tracking
 
prior
 
to
 
scheduled
 
appointment.
 
●
 
Action:
 
If
 
$\text{ETA}
 
-
 
t_{\text{scheduled}}
 
>
 
15
 
\text{
 
mins}$
,
 
the
 
system
 
sets
 
status
 
to
 
Late
 
Risk
,
 
offers
 
the
 
immediate
 
slot
 
to
 
an
 
on-site
 
walk-in
 
patient,
 
and
 
re-slots
 
the
 
arriving
 
patient
 
into
 
a
 
dynamically
 
calculated
 
buffer
 
window.
 
 
4.
 
System
 
Schema
 
Updates
 
Updated
 
Entities:
 
1.
 
Patient
 
Vitals
 
Stream:
 
patient_id
,
 
timestamp
,
 
heart_rate
,
 
spo2
,
 
pain_score
,
 
deterioration_flag
.
 
2.
 
Room
 
Equipment
 
Mapping:
 
room_id
,
 
equipment_ids[]
,
 
sanitization_status
,
 
turnover_timer
.
 
3.
 
Queue
 
Records:
 
queue_id
,
 
patient_id
,
 
esi_level
,
 
deterioration_score
,
 
priority_index_P
,
 
eta_delay_status
.
 