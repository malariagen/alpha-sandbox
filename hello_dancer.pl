#!/usr/bin/env perl

use Dancer;

get '/:name' => sub {
    return "Hello ".param('name');
};
