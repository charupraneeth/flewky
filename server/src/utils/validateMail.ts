const mailEndings = [".edu.in", ".ac.in", ".edu"];

const getCollege = (email: string): string => {
  if (adminMails.includes(email)) return "srmist.edu.in.";
  return email.substring(email.lastIndexOf("@") + 1);
};

const adminMails = [
  "admin@flewky.com",
  "ceo@flewky.com",
  "sreeg459@gmail.com",
  "bhanuprakash.svchs@gmail.com",
  "farmingtong123@gmail.com",
];

function isCollegeMail(email: string) {
  if (!email) return false;
  if (adminMails.includes(email)) return true;
  let isValid = false;
  for (let ending of mailEndings) {
    if (email.endsWith(ending)) {
      isValid = true;
      break;
    }
  }
  return isValid;
}

export { isCollegeMail, getCollege };
