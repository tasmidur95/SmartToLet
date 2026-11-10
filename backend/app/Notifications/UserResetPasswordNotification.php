<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Password reset mail for site users. When FRONTEND_URL is set the link points at the React
 * app (/reset-password?token=&email=); otherwise the legacy Blade reset page is used.
 */
class UserResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable)
    {
        $frontend = \App\Support\PublicUrl::frontend();
        if (!$frontend) {
            return parent::toMail($notifiable);
        }

        $url = rtrim($frontend, '/') . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('Reset your password')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset password', $url)
            ->line('This link expires in ' . config('auth.passwords.users.expire') . ' minutes.')
            ->line('If you did not request a password reset, no further action is required.');
    }
}
