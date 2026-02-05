<!DOCTYPE html>
<html>
<head>
    <title>Register</title>
</head>
<body>

@if ($errors->any())
    <ul>
        @foreach ($errors->all() as $error)
            <li style="color:red">{{ $error }}</li>
        @endforeach
    </ul>
@endif

@if (session('success'))
    <p style="color:green">{{ session('success') }}</p>
@endif

<form method="POST" action="{{ route('register') }}">
    @csrf

    <input name="name" placeholder="Name"><br><br>
    <input name="email" placeholder="Email"><br><br>
    <input type="password" name="password" placeholder="Password"><br><br>
    <input type="password" name="password_confirmation" placeholder="Confirm Password"><br><br>

    <button type="submit">Register</button>
</form>

</body>
</html>
