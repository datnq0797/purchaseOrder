<?php

use Illuminate\Support\Facades\Route;

/*
 * The React SPA is built into public/ (index.html + assets/).
 * Serve it at "/" and for every non-API path so client-side routing
 * (BrowserRouter deep links like /orders/5/edit) works on reload.
 */
$spa = function () {
    $index = public_path('index.html');

    abort_unless(is_file($index), 404, 'Frontend chưa được build (thiếu public/index.html).');

    return response()->file($index);
};

Route::get('/', $spa);

Route::fallback(function () use ($spa) {
    // Unknown /api/* paths should still behave like an API (JSON 404),
    // not return the SPA shell.
    abort_if(request()->is('api/*'), 404);

    return $spa();
});
