const mailEndings = ["@srmist.edu.in"];
const adminMails = [
  "admin@flewky.com",
  "ceo@flewky.com",
  "sreeg459@gmail.com",
  "charsproteny@gmail.com",
  "charupraneeth@gmail.com",
  "bhanuprakash.svchs@gmail.com",
];

function isCollegeMail(email: string) {
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

export { isCollegeMail };
