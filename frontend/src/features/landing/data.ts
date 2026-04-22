import { teamImages } from "./team_images";

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const faqs: FaqItem[] = [
  {
    question: "What does the AI actually do in this platform?",
    answer:
      "The system supports triage in three ways: category suggestion while writing a report, priority prediction when a report is submitted, and agency-to-department routing so tickets land with the right team.",
  },
  {
    question: "Can anyone create an account?",
    answer:
      "Citizen sign-up is available directly from the landing page. Manager and admin accounts are controlled roles and sign in with existing credentials.",
  },
  {
    question: "What happens if a report is routed to the wrong department?",
    answer:
      "Department managers can submit a reassign request with a reason, and admins can approve or reject it. Admins can also directly change the assigned department from the admin dashboard.",
  },
  {
    question: "What information is required when citizens submit a report?",
    answer:
      "A valid report includes title, description, category, location, neighborhood, and police district. Optional context fields are also supported to improve routing and priority prediction.",
  },
];

export const team: TeamMember[] = [
  {
    name: "Bushra Sami Abu Shammala",
    role: "AI & Data Science Developer",
    bio: "AI & Data Science student passionate about programming, data analysis, and machine learning. Focused on building smart, real-world solutions.",
    image: teamImages.bushra,
    linkedin: "https://www.linkedin.com/in/bushrasami132006",
  },
  {
    name: "Nadeen Monther Shadeed",
    role: "AI and Front-End Developer",
    bio: "Computer Systems Engineering student passionate about problem solving, AI, and front-end development, building practical solutions.",
    image: teamImages.nadeen,
    linkedin: "https://www.linkedin.com/in/nadeen-shadeed-60211a2a5/",
  },
  {
    name: "Mohammed Ashraf Abu Taleb",
    role: "Full Stack Web Developer",
    bio: "Full-stack web developer passionate about building interactive, user-friendly applications using modern web technologies.",
    image: teamImages.mohammed,
    linkedin: "https://www.linkedin.com/in/mohammed2002",
  },
];
