<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Login</title>
  <link rel="stylesheet" href="/css/page.css">
  <link rel="stylesheet" href="/css/login.css">
</head>
<body>
  <form method="POST" action="/login" class="login-container">
    @csrf
    <h3>Student Login</h3>
    <div class="form-container">
      <div>
        <label for="username">Username</label>
        <input type="text" name="username" id="username" required autofocus>
      </div>
      <div>
        <label for="password">Password<br><span style="font-size:0.95em;color:#888; font-weight:400">(birthdate as ddmmyyyy)</span></label>
        <input type="password" name="password" id="password" required>
      </div>
      @if($errors->any())
        <div class="validation-error">{{ $errors->first() }}</div>
      @endif
      <button type="submit">Login</button>
      <div style="margin-top: 10px; text-align: center;">
        <a href="/register" style="color: #00b4d8; text-decoration: underline;">Don't have an account? Register</a>
      </div>
    </div>
  </form>
</body>
</html>