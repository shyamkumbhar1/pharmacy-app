<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:users,name',
            'age' => 'required|integer|min:1|max:120',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'age' => $validated['age'],
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Registration successful.',
        ], 201);
    }

    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'users' => $users,
        ]);
    }
}

