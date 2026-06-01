<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class GameException extends HttpException
{
    public static function characterNotInSession(): self
    {
        return new self(400, 'This character is not part of this game session.');
    }

    public static function characterAlreadyFound(): self
    {
        return new self(400, 'Character already found.');
    }

    public static function sessionAlreadyCompleted(): self
    {
        return new self(400, 'Game session is already completed.');
    }

    public static function markFoundFailed(): self
    {
        return new self(500, 'Failed to mark character as found.');
    }

    public static function invalidCharacters(): self
    {
        return new self(422, 'One or more characters are not available.');
    }
}
