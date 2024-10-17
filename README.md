# Data-visualization-MC1-challenge
A solution to the Vast 2021 Mini Challenge 1
# Background
This scenario and all the people, places, groups, technologies, contained therein are fictitious. Any resemblance to real people, places, groups, or technologies is purely coincidental.

In the roughly twenty years that Tethys-based GAStech has been operating a natural gas production site in the island country of Kronos, it has produced remarkable profits and developed strong relationships with the government of Kronos. However, GAStech has not been as successful in demonstrating environmental stewardship.

In January, 2014, the leaders of GAStech are celebrating their new-found fortune as a result of the initial public offering of their very successful company. In the midst of this celebration, several employees of GAStech go missing. An organization known as the Protectors of Kronos (POK) is suspected in the disappearances.

It is January 21, 2014, and as an expert in visual analytics, you have been tasked with helping people understand the complex relationships among people and organizations that may have contributed to these events.

# Tasks and Questions:
Mini-Challenge 1 looks at the relationships and conditions that led up to the kidnapping. As an analyst, you have a set of current and historical news reports at your disposal, as well as resumes of numerous GAStech employees and email headers from two weeks of internal GAStech company email. Help identify the complex relationships among all of the people and organizations.

Use visual analytics to analyze the available data and develop responses to the questions below.

1) Characterize the news data sources provided. Which are primary sources and which are derivative sources? What are the relationships between the primary and derivative sources.

2) Characterize any biases you identify in these news sources, with respect to their representation of specific people, places, and events. Give examples. 

3) Given the data sources provided, use visual analytics to identify potential official and unofficial relationships among GASTech, POK, the APA, and Government. Include both personal relationships and shared goals and objectives. Provide evidence for these relationships.

## Features

### 1. Network Link Model
- Interactive force-directed graph
- Organizational hierarchy visualization
- Communication pattern analysis
- Node sizing based on organizational importance
- Color-coded relationship indicators

### 2. Word Cloud 
- Dynamic term visualization
- Real-time updates based on selected articles
- Interactive sizing and coloring
- Automated stop word filtering

### 3. Circular Network Graph
- News source relationship visualization
- Interactive arc selection
- Dynamic content updates
- Integrated word cloud generation

### 4. Timeline Visualization
- Chronological event mapping
- Interactive date selection
- Relationship tracking over time

## Tech Stack
- Frontend Framework: Vanilla JavaScript
- Visualization Library: D3.js
- Styling: Tailwind CSS
- Data Processing: Python (preprocessing)

## Project Structure
```
kronos-incident/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── networkLink.js
│   ├── wordCloud.js
│   ├── circularNetwork.js
│   ├── timeline.js
│   └── main.js
├── data/
│   ├── processed/
│   │   ├── network-data.json
│   │   ├── sentiment-data.json
│   │   └── timeline-data.json
│   └── raw/
│       ├── news-articles/
│       ├── email-headers/
│       └── employee-resumes/
└── python/
    └── data_processing/
        ├── preprocess.py
        └── sentiment_analysis.py
```
