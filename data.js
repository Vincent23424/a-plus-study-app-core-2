/* CompTIA A+ Core 2 Study App - source-grounded data */
const DATA = {
  "modules": [
    {"id":11,"title":"Managing Support Procedures","lessons":["11A Documentation","11B Professional Communication","11C Operating Systems"],"icon":"fa-clipboard-list","color":"from-blue-500 to-indigo-600"},
    {"id":12,"title":"Configuring Windows","lessons":["12A Windows User Settings","12B Windows System Settings","12C Applications","12D Cloud Apps"],"icon":"fa-sliders","color":"from-sky-500 to-blue-600"},
    {"id":13,"title":"Managing Windows","lessons":["13A Management Consoles","13B Command-Line Tools","13C Windows Networking"],"icon":"fa-terminal","color":"from-emerald-500 to-teal-700"},
    {"id":14,"title":"Supporting Windows","lessons":["14A Network Troubleshooting","14B Remote Access","14C Performance Tools","14D OS Troubleshooting"],"icon":"fa-screwdriver-wrench","color":"from-amber-500 to-orange-600"},
    {"id":15,"title":"Securing Windows","lessons":["15A Logical Security","15B Windows Security Settings","15C Windows Shares"],"icon":"fa-shield-halved","color":"from-purple-500 to-indigo-700"},
    {"id":16,"title":"Installing Operating Systems","lessons":["16A Windows Editions","16B OS Installations & Upgrades"],"icon":"fa-hard-drive","color":"from-cyan-500 to-blue-600"},
    {"id":17,"title":"Supporting Other OS","lessons":["17A Linux Features","17B Package & Network Mgmt","17C macOS Features"],"icon":"fa-brands fa-linux","color":"from-amber-600 to-yellow-500"},
    {"id":18,"title":"Configuring SOHO Network Security","lessons":["18A Attacks & Threats","18B Wireless Security","18C SOHO Router Security"],"icon":"fa-wifi","color":"from-rose-500 to-red-600"},
    {"id":19,"title":"Managing Security Settings","lessons":["19A Account Security","19B Workstation Security","19C Browser Security"],"icon":"fa-key","color":"from-purple-600 to-pink-600"},
    {"id":20,"title":"Supporting Mobile Software","lessons":["20A Mobile OS Security","20B Mobile App Troubleshooting"],"icon":"fa-mobile-screen","color":"from-teal-500 to-emerald-600"},
    {"id":21,"title":"Using Data Security","lessons":["21A Data Backup & Recovery","21B Data Handling Best Practices","21C Artificial Intelligence"],"icon":"fa-database","color":"from-indigo-600 to-blue-700"},
    {"id":22,"title":"Implementing Operational Procedures","lessons":["22A Change Management","22B Safety & Environment","22C Scripting Basics"],"icon":"fa-code","color":"from-slate-600 to-slate-800"}
  ],
  "flashcards": {
    "11": [
      {"term": "SOP", "def": "Standard Operating Procedure — Skriftliga instruktioner och rutiner."},
      {"term": "SLA", "def": "Service Level Agreement — Avtal om servicenivåer och svarstider."}
    ],
    "12": [
      {"term": "Windows Settings", "def": "Touch-anpassat gränssnitt för att hantera inställningar i Windows."}
    ]
  },
  "questions": [
    {
      "id": "c2-0001",
      "module": 11,
      "lesson": "11A Documentation",
      "question": "Which Core 2 term is described by written policies and procedures to help staff understand and fulfill their tasks?",
      "options": ["Deal Appropriately with Confidential Materials", "Standard Operating Procedure", "Escalation Levels", "Professional Documentation"],
      "answer": 1,
      "explanation": "Standard Operating Procedure (SOP) guidance provides clear written operational instructions."
    }
  ]
};
