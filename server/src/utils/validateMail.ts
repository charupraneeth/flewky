const getCollege = (email: string): string => {
  if (adminMails.includes(email)) return "srmist.edu.in.";
  return email.substring(email.lastIndexOf("@") + 1);
};

const adminMails = [
  "admin@flewky.com",
  "ceo@flewky.com",
  "sreeg459@gmail.com",
  "farmingtong123@gmail.com",
  "bhanuprakash.svchs@gmail.com",
];

function isCollegeMail(email: string) {
  if (!email) return false;
  if (adminMails.includes(email)) return true;
  if (email.endsWith(".edu")) return true;
  else if (
    email.match(
      /\.(edu|ac)\.("af|al|dz|as|ad|ao|ai|aq|ag|ar|am|aw|au|at|az|bs|bh|bd|bb|by|be|bz|bj|bm|bt|bo|ba|bw|bv|br|io|vg|bn|bg|bf|bu|bi|kh|cm|ca|cv|ky|cf|td|cl|cn|cx|cc|co|km|cg|ck|cr|ci|hr|cu|cy|cz|cs|yd|dk|dj|dm|do|tp|ec|eg|sv|gq|er|ee|et|fk|fo|fj|fi|fr|fx|gf|pf|tf|ga|gm|ge|dd|de|gh|gi|gr|gl|gd|gp|gu|gt|gn|gw|gy|ht|hm|hn|hk|hu|is|in|id|iq|ie|ir|il|it|jm|jp|jo|kz|ke|ki|kp|kr|kw|kg|la|lv|lb|ls|lr|ly|li|lt|lu|mo|mg|mw|my|mv|ml|mt|mh|mq|mr|mu|yt|mx|fm|md|mc|mn|ms|ma|mz|mm|na|nr|np|nl|an|nt|nc|nz|ni|ne|ng|nu|nf|mp|no|om|pk|pw|pa|pg|py|pe|ph|pn|pl|pt|pr|qa|re|ro|ru|rw|lc|ws|sm|st|sa|sn|sc|sl|sg|sk|si|sb|so|za|gs|es|lk|sh|kn|pm|vc|sd|sr|sj|sz|se|ch|sy|tw|tj|tz|th|tg|tk|to|tt|tn|tr|tm|tc|tv|ug|ua|su|ae|gb|um|us|vi|zz|uy|uz|vu|va|ve|vn|wf|eh|ye|yu|zr|zm|zw")/
    )
  ) {
    return true;
  }
  return false;
}

export { isCollegeMail, getCollege };
