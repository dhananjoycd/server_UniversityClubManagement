export const normalizeEmailAddress = (email: string) => {
  const trimmedEmail = email.trim().toLowerCase();
  const atIndex = trimmedEmail.lastIndexOf("@");

  if (atIndex === -1) {
    return trimmedEmail;
  }

  const localPart = trimmedEmail.slice(0, atIndex);
  const rawDomain = trimmedEmail.slice(atIndex + 1);
  const domain = rawDomain == "googlemail.com" ? "gmail.com" : rawDomain;

  if (domain != "gmail.com") {
    return `${localPart}@${domain}`;
  }

  const plusIndex = localPart.indexOf("+");
  const withoutPlus = plusIndex >= 0 ? localPart.slice(0, plusIndex) : localPart;
  const withoutDots = withoutPlus.replace(/\./g, "");

  return `${withoutDots}@${domain}`;
};
