# Product Requirements Document (PRD)


## DESIGN REQUIREMENT DOCUMENT

CPU Scheduling Simulator

Preemptive and Non-Preemptive Scheduling with Comparison Dashboard

Prepared for design, development, testing, and viva review

1. Document Overview

Purpose: Define the product requirements, user experience, data handling, scheduling behavior, comparison modes, and edge cases for the CPU Scheduling Simulator.

Product vision: Build an interactive dashboard that not only simulates six CPU scheduling algorithms, but also compares them and explains which one performs best for a given workload.

2. Problem Statement

Students often learn CPU scheduling as isolated textbook algorithms, but they rarely see how different policies behave on the same input. The project should close that gap by allowing users to enter or upload process data, run all major scheduling strategies, and inspect execution order, metrics, and visual comparison in one place.

3. Goals and Non-Goals

4. Target Users

Primary user: students building or submitting an OS mini-project.

Secondary user: instructors evaluating scheduling correctness, visualization quality, and analytical depth.

Tertiary user: team members demonstrating system behavior during presentation or viva.

5. Product Scope

5.1 Included in MVP

Six algorithms: FCFS, SJF Non-Preemptive, Priority Non-Preemptive, SRTF, Priority Preemptive, and Round Robin.

Manual entry of processes with validation.

CSV/JSON upload for bulk input.

Process table with completion time, turnaround time, waiting time, and response time.

Colored Gantt chart with idle time handling.

Algorithm comparison dashboard with charts, tables, and insights.

Summary metrics: average waiting time, average turnaround time, CPU utilization, throughput, response time, and context switches.

5.2 Future Enhancements

Export reports to PDF or Excel.

Save previous runs in local history.

Add dark mode and theme customization.

Add sensitivity analysis for Round Robin quantum values.

Add weighted scoring and fairness indices.

6. Functional Requirements

7. Algorithm Requirements

The product must support the following six algorithms with fixed tie-breaking rules for deterministic output.

8. Input and Validation Rules

Required fields for all processes: Process ID, Arrival Time, Burst Time.

Priority is required for priority-based algorithms.

Time Quantum is required for Round Robin.

Arrival Time and Burst Time must be non-negative numbers.

Burst Time must be greater than zero.

Process IDs must be unique.

Uploaded files must be readable and contain expected columns/keys.

Blank rows, missing values, and non-numeric text must be rejected with clear error messages.

The app must prevent execution until all validation errors are resolved.

9. Output and Visualization Requirements

A process-wise result table must show start time, completion time, turnaround time, waiting time, and response time.

The Gantt chart must show process execution blocks in color and idle intervals in a neutral color.

Summary cards must show average waiting time, average turnaround time, average response time, CPU utilization, throughput, total idle time, and context switches.

Comparison charts must allow visual side-by-side evaluation of all six algorithms.

The UI should keep charts, tables, and insights separated into tabs or panels for readability.

10. Comparison Modes

10.1 Graphical Comparison

Bar charts for average waiting time, turnaround time, response time, CPU utilization, throughput, and context switches.

Optional line or radar-style visual summaries if they improve clarity.

Use the same scale across algorithms to avoid misleading interpretation.

10.2 Tabular Comparison

A compact comparison table must list each algorithm with key metrics and rank.

Highlight best and worst values visually.

Use the same input dataset for every algorithm in the comparison run.

10.3 Insight Comparison

Auto-generate plain-language conclusions from the metrics.

Highlight best performer, fairness trade-off, starvation risk, and context-switch overhead.

Explain why a particular algorithm performed well or poorly for the given workload.

10.4 Sensitivity / What-if Comparison

For Round Robin, compare multiple time quantum values on the same dataset.

Show how quantum affects waiting time, turnaround time, and context switching.

This is optional for MVP but valuable for presentation.

11. Data Model Requirements

Process entity should store PID, arrival, burst, priority, remaining time, first start time, and completion time.

Metrics should be computed centrally using a shared formula layer.

Every algorithm must return the same output structure so comparison is straightforward.

The schedule timeline should be represented as ordered intervals: process ID, start time, and end time.

12. UX / UI Requirements

Use a modern dashboard layout with sidebar navigation and main content tabs.

Include input preview before running the simulation.

Present results in a clear hierarchy: summary cards first, then charts, then tables, then insights.

Use readable spacing, consistent alignment, and a restrained color palette.

Make algorithm choice and comparison mode obvious at all times.

Provide clear empty states and error states.

13. Edge Cases

14. Metrics Definitions

15. Quality and Acceptance Criteria

Results must be deterministic for the same input.

Table values must match the Gantt chart timeline.

Comparison results must be based on identical process input across algorithms.

Validation errors must be understandable to non-technical users.

The dashboard must remain usable with both small and moderately large inputs.

16. Risks and Mitigation

17. Suggested MVP Milestones

Milestone 1: Define data model and validation rules.

Milestone 2: Implement all six scheduling algorithms.

Milestone 3: Standardize output structure and metrics.

Milestone 4: Build Gantt chart and summary visuals.

Milestone 5: Add file upload and preview.

Milestone 6: Add comparison dashboard and insight generation.

Milestone 7: Test edge cases and polish UI.

18. Final Product Statement

The CPU Scheduling Simulator will be an interactive, comparison-driven dashboard that allows users to simulate six standard scheduling algorithms, visualize execution clearly, handle bulk input through files, and derive useful insights from the same workload.

In short: it should help a user not only see which process runs next, but also understand which scheduling strategy performs best and why.

19. Recommended Input Schema

Supported file formats: CSV and JSON

20. Fixed Conventions

Lower numeric priority means higher scheduling priority.

Waiting Time = Turnaround Time - Burst Time.

Turnaround Time = Completion Time - Arrival Time.

Response Time = First Start Time - Arrival Time.

All comparison runs must reuse the same input dataset.

Document Type | Design Requirement Document

Version | 1.0

Scope | Academic mini-project with interactive analytics

Platform | Python + Streamlit

Goals | Non-Goals

Support all 6 scheduling algorithms. | Do not build a general-purpose operating system simulator.

Accept manual input and file upload. | Do not include multi-user collaboration.

Show process table, Gantt chart, and summary metrics. | Do not add unrelated OS modules such as paging, deadlock, or file systems.

Provide algorithm comparison and recommendations. | Do not attempt machine learning-based prediction in MVP.

ID | Requirement | Priority | Acceptance Criteria

FR-01 | User can choose one of six scheduling algorithms. | Must | The app switches algorithms without page errors.

FR-02 | User can enter process data manually. | Must | App validates values and prevents invalid submission.

FR-03 | User can upload CSV or JSON process files. | Must | Valid files are parsed into a preview table.

FR-04 | App computes execution order and timing metrics. | Must | Results match scheduling rules and formulas.

FR-05 | App renders a colored Gantt chart. | Must | Each process block is visible with time labels.

FR-06 | App displays a process-wise summary table. | Must | All metrics appear in one readable table.

FR-07 | App compares all six algorithms on same input. | Must | Comparison view uses identical process data.

FR-08 | App provides analytical insights. | Should | Insights identify best algorithm and major trade-offs.

Type | Algorithm | Behavior | Key Risk

Non-preemptive | FCFS | Executes in arrival order, one process at a time. | Convoy effect

Non-preemptive | SJF | Chooses the shortest burst among ready processes. | Starvation

Non-preemptive | Priority | Chooses highest priority among ready processes. | Starvation

Preemptive | SRTF | Always runs the process with the shortest remaining time. | Frequent preemption

Preemptive | Priority | Preempts when a higher-priority process arrives. | Starvation

Preemptive | Round Robin | Allocates fixed time quantum in FIFO queue order. | Quantum sensitivity

Scenario | Required Behavior

No processes entered | Disable run action and show a validation message.

All processes arrive at same time | Use tie-breaking rules consistently.

CPU idle at start | Show idle block in Gantt chart and include it in utilization.

Equal burst times or priorities | Apply fixed tie-break rules.

Round Robin quantum larger than burst times | Algorithm should behave like FCFS for that case.

Very small Round Robin quantum | Allow the result but warn about high context switching.

Long file upload | Parse efficiently and show preview rows.

Duplicate process IDs | Reject upload or manual input until fixed.

Metric | Formula | Purpose

Turnaround Time | Completion Time - Arrival Time | Measures total time spent in system.

Waiting Time | Turnaround Time - Burst Time | Measures time spent waiting in ready queue.

Response Time | First Start Time - Arrival Time | Measures first response delay.

CPU Utilization | Busy Time / Total Time * 100 | Shows how effectively CPU was used.

Throughput | Completed Processes / Total Time | Shows rate of completed jobs.

Risk | Impact | Mitigation

Incorrect preemption logic | Wrong output | Write algorithm-by-algorithm test cases.

Ambiguous tie-breaking | Inconsistent results | Fix global tie-break rules in the design.

Poor chart readability | Weak demo impact | Use color consistency and labels.

Bad file formatting | Broken uploads | Validate columns and row-level errors.

Field | Required | Example | Notes

pid | Yes | P1 | Unique process identifier

arrival | Yes | 0 | Non-negative integer or float

burst | Yes | 5 | Must be greater than zero

priority | Only for priority | 2 | Lower number = higher priority

quantum | Only for RR | 4 | Entered once for the selected run



---

# 🧾 Technical Requirement Document (TRD)

## 1. System Overview

The system is a **Python-based CPU Scheduling Simulator** with:

* 6 scheduling algorithms
* Interactive dashboard (Streamlit)
* File upload support (CSV/JSON)
* Visualization (Gantt + graphs)
* Comparison + insights engine

---

## 2. Tech Stack

### Core

* **Language:** Python 3.x
* **Framework:** Streamlit

### Libraries

* **Pandas** → data handling
* **Plotly** → charts & Gantt
* **NumPy (optional)** → calculations

---

## 3. System Architecture

### High-Level Flow

```
User Input → Validation → Scheduling Engine → Metrics Engine → Visualization → Comparison → Insights
```

---

## 4. Module Breakdown

### 4.1 Input Module

Handles:

* Manual input (UI form)
* File upload (CSV/JSON)

Validation:

* No negative values
* Unique PID
* Required fields present

---

### 4.2 Core Data Model

```python
class Process:
    pid: str
    arrival: int
    burst: int
    priority: int
    remaining: int
    start_time: int
    completion_time: int
```

---

### 4.3 Scheduling Engine

#### Algorithms (6)

* FCFS
* SJF (Non-preemptive)
* Priority (Non-preemptive)
* SRTF
* Priority (Preemptive)
* Round Robin

---

### 4.4 Output Contract (Standard for all algorithms)

```python
{
  "processes": [...],
  "gantt": [...],
  "metrics": {...}
}
```

---

### 4.5 Metrics Engine

Compute:

* Turnaround Time = CT - AT
* Waiting Time = TAT - BT
* Response Time = First Start - AT
* CPU Utilization
* Throughput
* Context Switches

---

### 4.6 Visualization Module

#### Gantt Chart

* Plotly timeline
* Color-coded processes
* Idle time support

#### Graphs

* Bar charts:

  * Avg WT
  * Avg TAT
  * CPU Utilization
  * Context Switches

---

### 4.7 Comparison Engine

* Runs all 6 algorithms on same dataset
* Outputs:

  * Comparison table
  * Graphs
  * Ranking

---

### 4.8 Insights Engine

Generates:

* Best algorithm
* Worst algorithm
* Starvation warning
* Fairness analysis
* Context switch impact

---

## 5. File Handling

### Supported Formats

* CSV
* JSON

### CSV Format

```
pid,arrival,burst,priority
P1,0,5,2
P2,1,3,1
```

---

## 6. UI Structure (Streamlit)

### Sidebar

* Algorithm selection
* File upload
* Quantum input
* Run button

### Main Tabs

* Input Preview
* Results
* Gantt Chart
* Comparison
* Insights

---

## 7. Key Constraints

* Same input must be used for all algorithms
* Tie-breaking must be consistent
* No negative times allowed
* Gantt chart must match computed results
* Round Robin must follow strict FIFO queue

---

## 8. Performance Considerations

* Handle up to ~100 processes smoothly
* Avoid nested unnecessary loops
* Use efficient sorting and queue structures

---

## 9. Error Handling

* Invalid file format
* Missing fields
* Duplicate PID
* Negative values
* Empty input

---

## 10. Testing Requirements

### Must test:

* Each algorithm correctness
* Edge cases (idle CPU, same arrival)
* Round Robin queue behavior
* File upload parsing
* Comparison accuracy

---

## 11. Deployment (Optional)

* Run locally via Streamlit
* Optional:

  * Deploy on Streamlit Cloud
