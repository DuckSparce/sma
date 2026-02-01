<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="author" content="Artem Kachur" />
  <meta name="description" content="A basic student management system" />
  <meta name="keywords" content="students, cms, management" />
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Dashboard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
  <link rel="stylesheet" href="{{ asset('css/page.css') }}">
  <link rel="stylesheet" href="{{ asset('css/header.css') }}">
  <link rel="stylesheet" href="{{ asset('css/navigation.css') }}">
</head>

<body data-page="dashboard">
  
  @include('partials.header')

  <section class="content-page">

    @include('partials.navigation')

    <div class="content-container">
      <h2 class="page-title">Dashboard</h2>
    </div>
  </section>

  <script type="module" src="{{ asset('js/notification-badge.js') }}"></script>
</body>

</html>