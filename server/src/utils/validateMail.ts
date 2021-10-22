const mailEndings = [
  "@srmist.edu.in",
  "@vit.ac.in",
  "@sastra.ac.in",
  "@daiict.ac.in",
  "@iitkgp.ac.in",
  "@iitd.ac.in",
  "@iitb.ac.in",
  "@bits-pilani.ac.in",
  "@pilani.bits-pilani.ac.in",
  "@goa.bits-pilani.ac.in",
  "@hyd.bits-pilani.ac.in",
];

const getCollege = (email: string): string => {
  if (adminMails.includes(email)) return "admin";
  return email.substring(email.lastIndexOf("@") + 1);
};

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

export { isCollegeMail, getCollege };
