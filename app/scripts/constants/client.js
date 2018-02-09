'use strict';

import ApolloClient from 'apollo-client';

import { createHttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, from } from 'apollo-link';

import { backend_uri } from './auth';


const httpLink = createHttpLink({
  uri: `${backend_uri}/graphql`,
  credentials: 'include'
});

export {httpLink};

const authMiddleWare = new ApolloLink((operation, forward) => {
  const token = sessionStorage.getItem('crate.auth.token');
  if (token !== null && typeof token !== undefined) {
    operation.setContext({
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return forward(operation);
});

export {authMiddleWare};

const errorLink = onError(({ networkError }) => {
  if (networkError.statusCode === 401) {
    // user not authorized - redirect to auth provider SSO page
    console.log('The user is not authorized');
  }
});

export { errorLink };

const client = new ApolloClient({
  link: from([errorLink, authMiddleWare, httpLink]),
  cache: new InMemoryCache ()
});

export { client };
