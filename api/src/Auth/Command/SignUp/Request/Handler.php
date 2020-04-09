<?php

declare(strict_types=1);

namespace App\Auth\Command\SignUp\Request;

use App\Auth\Entity\User\Email;
use App\Auth\Entity\User\Id;
use App\Auth\Entity\User\User;
use App\Auth\Entity\User\UserRepository;
use App\Auth\Service\PasswordHasher;
use App\Auth\Service\Tokenizer;
use App\Flusher;
use DateTimeImmutable;
use DomainException;

class Handler
{
    private UserRepository $users;
    private PasswordHasher $hasher;
    private Tokenizer $tokenizer;
    private Flusher $flusher;

    public function __construct(UserRepository $users, PasswordHasher $hasher, Tokenizer $tokenizer, Flusher $flusher)
    {
        $this->users = $users;
        $this->hasher = $hasher;
        $this->tokenizer = $tokenizer;
        $this->flusher = $flusher;
    }

    public function handle(Command $command): void
    {
        $email = new Email($command->email);

        if ($this->users->hasByEmail($email)) {
            throw new DomainException('Пользователь с таким E-mail уже есть.');
        }

        $date = new DateTimeImmutable();

        $user = User::requestForConfirm(
            Id::generate(),
            $date,
            $email,
            $this->hasher->hash($command->password),
            $token = $this->tokenizer->generate($date)
        );

        $this->users->add($user);

        $this->flusher->flush($user);
    }
}
