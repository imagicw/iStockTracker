export const formatCurrency = (val: number) =>
{
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(val);
};

export const formatNumber = (val: number, digits = 2) =>
{
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(val);
};

export const formatDateForInput = (dateStr: string | undefined): string =>
{
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try
  {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e)
  {
    return dateStr;
  }
};

export const mockFetchPrice = async (_code: string): Promise<number> =>
{
  await new Promise((resolve) => setTimeout(resolve, 500));
  return parseFloat((Math.random() * 50 + 10).toFixed(2));
};

export const getFirebaseErrorMessage = (error: any): string =>
{
  if (error)
  {
    if (error.includes('auth/user-not-found')) return '账号密码不正确，请重试';
    if (error.includes('auth/wrong-password')) return '账号密码不正确，请重试';
    if (error.includes('auth/email-already-in-use')) return '该邮箱已被注册';
    if (error.includes('auth/invalid-email')) return '邮箱格式不正确';
    if (error.includes('auth/weak-password')) return '密码强度太低';
    if (error.includes('auth/network-request-failed')) return '网络请求失败，请检查网络';
    if (error.includes('unavailable')) return '服务暂时不可用';
    if (error.includes('auth/admin-restricted-operation')) return '操作受限';
    if (error.includes('auth/invalid-credential')) return '账号密码不正确，请重试';
    return `未知错误 (${error})`;
  }
  return error?.message || '发生未知错误';
};

export const sanitizeCSVField = (value: string | number | undefined | null): string =>
{
  if (value === undefined || value === null) return "";
  let str = String(value);

  // Prevent CSV Injection
  // If the field starts with any of the following characters: =, +, -, @, \t, \r
  // prepend a single quote to force it to be treated as text.
  if (/^[=+\-@\t\r]/.test(str))
  {
    str = "'" + str;
  }

  // Escape double quotes by replacing " with ""
  str = str.replace(/"/g, '""');

  // Wrap the entire field in double quotes
  return `"${str}"`;
};
