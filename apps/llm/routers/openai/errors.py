from singlepage.errors import GatewayError, error_response


def handle_gateway_error(error: GatewayError):
    return error_response(error)
