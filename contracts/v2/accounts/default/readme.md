# Default Module

### Details
- Contains basics smart account setters & getters function. Eg:- enable/disable new owners, 
- Module called by default if the function that user is trying to call is not defined in implementations.sol located at ../../registry/implementations.sol. If that function is not available in default module then smart account throws error.