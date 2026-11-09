import { expect, test } from "@playwright/test";

test("shows the registration controls and blocks a password shorter than six characters", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "登入團購好朋友" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Email／密碼登入" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 登入" })).toBeVisible();

  const email = page.getByLabel("電子郵件");
  const password = page.getByLabel("密碼");
  await expect(email).toHaveAttribute("type", "email");
  await expect(email).toHaveAttribute("required", "");
  await expect(password).toHaveAttribute("required", "");
  await expect(password).toHaveAttribute("minlength", "6");

  await email.fill("member@example.com");
  await password.fill("12345");
  await page.getByRole("button", { name: "註冊新帳號" }).click();

  const validation = await password.evaluate((element) => {
    const input = element as HTMLInputElement;
    return {
      tooShort: input.validity.tooShort,
      valid: input.validity.valid,
      formValid: input.form?.checkValidity() ?? true,
    };
  });

  expect(validation).toEqual({
    tooShort: true,
    valid: false,
    formValid: false,
  });
  await expect(page.getByRole("heading", { name: "登入團購好朋友" })).toBeVisible();
});
