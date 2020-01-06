<?php

declare(strict_types=1);

use Api\Infrastructure\Model\EventDispatcher\Listener;
use Api\Infrastructure\Model\EventDispatcher\SyncEventDispatcher;
use Api\Model\User as UserModel;
use Api\Model\Task as TaskModel;
use Psr\Container\ContainerInterface;

return [
    Api\Model\EventDispatcher::class => function (ContainerInterface $container) {
        return new SyncEventDispatcher(
            $container,
            [
                UserModel\Entity\User\Event\UserCreated::class => [
                    Listener\User\CreatedListener::class,
                ],
                TaskModel\Entity\Task\Event\TaskCreated::class => [
                    Listener\Task\CreatedListener::class,
                ],
            ]
        );
    },

    Listener\User\CreatedListener::class => function (ContainerInterface $container) {
        return new Listener\User\CreatedListener(
            $container->get(Swift_Mailer::class),
            $container->get('config')['mailer']['from']
        );
    },

    Listener\Task\CreatedListener::class => \DI\autowire( Listener\Task\CreatedListener::class),
];
