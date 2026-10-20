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
    github: "github.com/lEVI2889",
    githubUrl: "https://github.com/lEVI2889",
    portfolio: "rohan.dev",
    portfolioUrl: "https://rohan.dev",
    linkedin: "linkedin.com/in/abumusarohan",
    linkedinUrl: "https://linkedin.com/in/abumusarohan",
    freelancer: "freelancer.com/u/rohan5689",
    freelancerUrl: "https://www.freelancer.com/u/rohan5689",
    twitter: "@levi_ack89",
    twitterUrl: "https://x.com/levi_ack89",
    profileImage: "assets/Professional Pic Rohan_org shirt.png",
    bio: "Computer Science and Engineering undergraduate at BRAC University and Generative AI Executive at UVTR InfoTech, producing AI video campaigns for clients including PRAN Ltd. and developing software products. Experienced in full-stack web (React, Node.js, PHP, MySQL), Android (Kotlin), and cryptographic security features from scratch."
  },

  skills: [
    "JavaScript & Python",
    "Java & PHP",
    "Kotlin & Android",
    "React.js & Node.js",
    "SQL & Database Design",
    "Generative AI & Prompting",
    "Cryptography & InfoSec",
    "Team & Club Leadership"
  ],

  languages: [
    { name: "English", level: "Fluent" },
    { name: "German", level: "Elementary" },
    { name: "Bengali", level: "Fluent" }
  ],

  experience: [
    {
      role: "Generative AI Executive",
      company: "UVTR InfoTech Ltd.",
      type: "Full-time · Dhaka (Hybrid)",
      period: "Aug 2026 – Present",
      location: "Dhaka, Bangladesh",
      bullets: [
        "Design AI models and characters with Higgsfield AI and ChatGPT, producing video ads for clients including PRAN Ltd.",
        "Write and refine prompts for consistent characters, scenes and product shots across a campaign, from first concept to the final ad.",
        "Contributed to software engineering team building client software products, including a WhatsApp bot, the team's most recent release."
      ]
    },
    {
      role: "Club President",
      company: "IABC, BRAC University",
      type: "Executive Leadership",
      period: "Feb 2026 – Present",
      location: "Dhaka, Bangladesh",
      bullets: [
        "Hosted Diplomat's Meet 2026, bringing together 160 participants.",
        "Run club operations, plan events and coordinate the executive team.",
        "Represent the student organization to the BRAC University student council."
      ]
    }
  ],

  projects: [
    {
      name: "FixSquad: Home Services Marketplace",
      technologies: "React, Node.js, Express, MySQL",
      period: "Aug – Sep 2026",
      details: "Main contributor in a 4-person team over 4 Agile sprints. Cryptography work was a Cryptography course extension.",
      bullets: [
        "Main contributor in a 4-person team over 4 Agile sprints. Cryptography work was a Cryptography course extension.",
        "Multi-role home services booking platform with automated invoicing, provider dashboards, and MVC architecture.",
        "Engineered custom cryptography suite: ARX password hashing, TOTP 2FA, AES-256-GCM, and RSA."
      ]
    },
    {
      name: "Cadence: Music Learning App",
      technologies: "Kotlin, Jetpack Compose",
      period: "Oct 2026 – Present",
      bullets: [
        "Native Android ear-training application with interactive Circle of Fifths.",
        "Digital piano keyboard synchronized to real-time sheet notation rendering."
      ]
    },
    {
      name: "EventNexus: Event Management Platform",
      technologies: "PHP, MySQL",
      period: "Jan 2026",
      bullets: [
        "Indoor platform with admin, host, and customer roles, automated venue clash detection, and dynamic PDF ticket issuance.",
        "Hardened against SQL injection using mysqli_real_escape_string and role-based access control."
      ]
    },
    {
      name: "The Final Tackle & 3D Graphics",
      technologies: "Python, OpenGL",
      period: "2026",
      bullets: [
        "Football-themed game built in Python alongside real-time 3D graphics rendering implementations utilizing OpenGL and matrix transformations."
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
      details: "Disciplined residential academy education emphasizing academic excellence."
    }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = portfolioData;
}
