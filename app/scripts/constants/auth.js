const rest_api_prefix = '/api/v1';

var backend_uri = 'https://cloud-api.crate.io';

// for local dev
// var backend_uri = 'http://localhost:5000';

export { backend_uri };

export const callback = {
    login_uri: backend_uri + rest_api_prefix + '/login?redirect_uri=' + window.location.href,
    logout_uri: backend_uri + rest_api_prefix + '/logout?prompt_login=false&redirect_uri=' + window.location.origin
};
