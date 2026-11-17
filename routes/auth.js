const express = require('express');
const router = express.Router();
const {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie
} = require('../middleware/auth');
const dataStore = require('../services/dataStore');

router.get('/dang-nhap', (req, res) => {
  const { tab, message, error, returnTo } = req.query;
  res.render('dang-nhap', {
    activeTab: tab === 'register' ? 'register' : 'login',
    successMessage: message || null,
    errorMessage: error || null,
    returnTo: returnTo || '',
    formData: {}
  });
});

router.get('/login', (req, res) => res.redirect('/dang-nhap'));
router.get('/dang-ky', (req, res) => res.redirect('/dang-nhap?tab=register'));

router.post('/dang-nhap', async (req, res) => {
  const { email, password, remember, returnTo } = req.body;
  if (!email || !password) {
    return res.render('dang-nhap', {
      activeTab: 'login',
      successMessage: null,
      errorMessage: 'Vui lòng nhập đầy đủ Email/Số điện thoại và Mật khẩu!',
      returnTo: returnTo || '',
      formData: { email: email || '' }
    });
  }

  try {
    const user = await dataStore.findUserByIdentifier(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.render('dang-nhap', {
        activeTab: 'login',
        successMessage: null,
        errorMessage: 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại!',
        returnTo: returnTo || '',
        formData: { email }
      });
    }

    setSessionCookie(res, user, Boolean(remember));

    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return res.redirect(returnTo);
    }
    if (user.role === 'admin') {
      return res.redirect('/admin?success=' + encodeURIComponent(`Xin chào ${user.fullname}!`));
    }
    return res.redirect('/?success=' + encodeURIComponent(`Đăng nhập thành công! Xin chào ${user.fullname}.`));
  } catch (err) {
    return res.render('dang-nhap', {
      activeTab: 'login',
      successMessage: null,
      errorMessage: 'Lỗi đăng nhập: ' + err.message,
      returnTo: returnTo || '',
      formData: { email }
    });
  }
});

router.post('/dang-ky', async (req, res) => {
  const { fullname, email, phone, password, confirmPassword } = req.body;
  const formData = { fullname: fullname || '', email: email || '', phone: phone || '' };

  if (!fullname || !email || !password) {
    return res.render('dang-nhap', {
      activeTab: 'register',
      successMessage: null,
      errorMessage: 'Vui lòng điền đầy đủ Họ tên, Email/SĐT và Mật khẩu!',
      returnTo: '',
      formData
    });
  }

  if (String(password).length < 6) {
    return res.render('dang-nhap', {
      activeTab: 'register',
      successMessage: null,
      errorMessage: 'Mật khẩu cần tối thiểu 6 ký tự!',
      returnTo: '',
      formData
    });
  }

  if (password !== confirmPassword) {
    return res.render('dang-nhap', {
      activeTab: 'register',
      successMessage: null,
      errorMessage: 'Mật khẩu xác nhận không khớp!',
      returnTo: '',
      formData
    });
  }

  try {
    const rawIdentifier = email.trim();
    const isPhoneOnly = /^[0-9+.\-\s]{8,15}$/.test(rawIdentifier);
    const normalizedEmail = isPhoneOnly
      ? `${rawIdentifier.replace(/\D/g, '')}@member.warrantyops.vn`
      : rawIdentifier.toLowerCase();
    const normalizedPhone = (phone && phone.trim()) || (isPhoneOnly ? rawIdentifier.trim() : '');

    const existing = await dataStore.findUserByIdentifier(normalizedEmail);
    if (existing) {
      return res.render('dang-nhap', {
        activeTab: 'register',
        successMessage: null,
        errorMessage: 'Email hoặc số điện thoại này đã được đăng ký tài khoản!',
        returnTo: '',
        formData
      });
    }

    const newUser = await dataStore.createUser({
      fullname,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: hashPassword(password),
      role: 'customer'
    });

    setSessionCookie(res, newUser, true);
    return res.redirect(
      '/?success=' +
        encodeURIComponent(`Tạo tài khoản thành công (${newUser.customerCode})! Chào mừng ${newUser.fullname}.`)
    );
  } catch (err) {
    return res.render('dang-nhap', {
      activeTab: 'register',
      successMessage: null,
      errorMessage: 'Không thể tạo tài khoản: ' + err.message,
      returnTo: '',
      formData
    });
  }
});

router.get('/dang-xuat', (req, res) => {
  clearSessionCookie(res);
  res.redirect('/dang-nhap?message=' + encodeURIComponent('Đã đăng xuất khỏi hệ thống an toàn.'));
});

router.post('/dang-xuat', (req, res) => {
  clearSessionCookie(res);
  res.redirect('/dang-nhap?message=' + encodeURIComponent('Đã đăng xuất khỏi hệ thống an toàn.'));
});

router.get('/logout', (req, res) => res.redirect('/dang-xuat'));

module.exports = router;
