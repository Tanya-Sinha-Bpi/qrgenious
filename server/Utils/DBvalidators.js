const restrictedUsernames = [
  "user",
  "admin",
  "test",
  "guest",
  "root",
  "superuser",
  "support",
  "info",
  "contact",
  "help",
  "webmaster",
  "administrator",
  "manager",
  "moderator",
  "dev",
  "developer",
  "owner",
  "account",
  "service",
  "sysadmin",
  "system",
  "staff",
  "sales",
  "service",
  "ceo",
  "cfo",
  "coo",
  "cto",
  "it",
  "team",
  "security",
  "billing",
  "finance",
  "legal",
  "public",
  "public-relations",
  "press",
  "news",
  "newsletter",
  "updates",
  "alerts",
  "notifications",
  "announcement",
  "xyz",
  "xxx",
  "yyy",
  "tuv",
  "abc",
  "def",
  "ghi",
  "jkl",
  "mno",
  "pqr",
  "stu",
  "vwx",
  "yz",
  "qwe",
  "asd",
  "zxc",
  "123",
  "456",
  "789",
  "000",
  "999",
  "111",
  "222",
  "333",
  "444",
  "555",
  "666",
  "777",
  "888",
];

for(let i=1; i<=100000000;i++){
    restrictedUsernames.push(`user${i}`);
}

const containsRestrictedKeywords = (username) =>{
    return restrictedUsernames.some((restricted)=>
    username.includes(restricted));
};

const isRestrictedEmails = (email)=>{
    const username = email.split("@")[0].toLowerCase();
    return containsRestrictedKeywords(username)
}

export default isRestrictedEmails;