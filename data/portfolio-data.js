/**
 * Portfolio & CV Data Model for Abu Musa Rohan
 * Generative AI Executive · Full-Stack Developer · CSE Undergraduate
 */

const portfolioData = {
  personal: {
    name: "Abu Musa Rohan",
    firstName: "ABU MUSA",
    lastName: "ROHAN",
    title: "Generative AI Executive · Full-Stack Developer · CSE Undergraduate",
    headline: "Generative AI Executive & Full-Stack Developer",
    location: "Dhaka, Bangladesh",
    address: "Dhaka, Bangladesh",
    phone: "+880 1722-615596",
    email: "abumusarohan2437@gmail.com",
    freelancer: "freelancer.com/u/rohan5689",
    freelancerUrl: "https://www.freelancer.com/u/rohan5689",
    github: "github.com/lEVI2889",
    githubUrl: "https://github.com/lEVI2889",
    linkedin: "linkedin.com/in/abumusarohan",
    linkedinUrl: "https://linkedin.com/in/abumusarohan",
    twitter: "@levi_ack89",
    twitterUrl: "https://x.com/levi_ack89",
    profileImage: "assets/Professional Pic Rohan_org shirt.png",
    bio: "Computer Science and Engineering undergraduate at BRAC University and Generative AI Executive at UVTR InfoTech, where I produce AI-generated video campaigns for client brands including PRAN Ltd. and build software with the development team. I develop full-stack web applications (React, Node.js, PHP, MySQL), Android applications (Kotlin), and cryptographic security engines from scratch. Seeking software engineering and AI internships and high-impact technical roles."
  },

  skills: [
    "JavaScript & Python",
    "Java & PHP",
    "Kotlin & Jetpack Compose",
    "React.js & Node.js",
    "SQL & Database Design",
    "Generative AI & Prompting",
    "Cryptography & InfoSec",
    "Team & Club Leadership"
  ],

  languages: [
    { name: "English", level: "Limited Working", percent: 85 },
    { name: "German", level: "Elementary", percent: 50 },
    { name: "Bengali", level: "Native", percent: 100 }
  ],

  experience: [
    {
      role: "Generative AI Executive",
      company: "UVTR InfoTech Ltd.",
      type: "Full-time (Hybrid)",
      period: "Aug 2026 – Present",
      location: "Dhaka, Bangladesh",
      bullets: [
        "Design AI models and characters with Higgsfield AI and ChatGPT, producing video advertisements for client brands including PRAN Ltd.",
        "Author prompt architectures ensuring character, scene, and product consistency from initial storyboard to broadcast release.",
        "Contributed to core development team shipping software products for enterprise clients, including a high-volume WhatsApp bot."
      ]
    },
    {
      role: "Club President",
      company: "IABC, BRAC University",
      type: "Executive Leadership",
      period: "Feb 2026 – Present",
      location: "Dhaka, Bangladesh",
      bullets: [
        "Organized and hosted Diplomat's Meet 2026, convening 160 distinguished delegates, corporate partners, and student participants.",
        "Lead operational logistics, executive team coordination, and strategic event planning across university departments.",
        "Serve as chief liaison representing the IABC student organization to the BRAC University Student Council."
      ]
    }
  ],

  projects: [
    {
      name: "FixSquad: Home Services Marketplace",
      technologies: "React, Node.js, Express, MySQL",
      period: "Aug – Sep 2026",
      bullets: [
        "Multi-role booking marketplace: provider dashboards, messaging, automated invoicing, ratings, and admin dispute resolution.",
        "Architected MVC backend with raw SQL, JWT auth, rate limiting, and rigorous XSS/IDOR defense over 4 Agile sprints.",
        "Engineered custom cryptography suite: ARX password hashing, TOTP 2FA, AES-256-GCM key management, RSA, and CBC-MAC."
      ]
    },
    {
      name: "Cadence: Music Learning App",
      technologies: "Kotlin, Jetpack Compose, Audio DSP",
      period: "Oct 2026 – Present",
      bullets: [
        "Native Android ear-training app featuring guided pedagogical modules and an interactive visual Circle of Fifths.",
        "Interactive digital piano keyboard synced to real-time musical notation sheet rendering."
      ]
    },
    {
      name: "EventNexus: Event Management Platform",
      technologies: "PHP, MySQL (Database Systems)",
      period: "Jan 2026",
      bullets: [
        "Indoor platform with admin, host, and customer roles, automated venue clash detection, and dynamic PDF ticket issuance.",
        "Hardened against SQL injection with strict role-based access control and parameterization."
      ]
    }
  ],

  education: [
    {
      degree: "Bachelor of Science in Computer Science and Engineering",
      institution: "BRAC University",
      period: "2023 – Present",
      location: "Dhaka, Bangladesh",
      details: "Relevant Coursework: Software Engineering, Cryptography, Database Systems, Computer Graphics, Data Structures, Algorithms."
    },
    {
      degree: "Higher Secondary Certificate (HSC), Science",
      institution: "Mirzapur Cadet College",
      period: "2016 – 2022",
      location: "Tangail, Bangladesh",
      details: "Disciplined residential military academy education emphasizing academic merit, competitive athletics, and drill leadership."
    }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = portfolioData;
}
