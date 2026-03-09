# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e5]:
    - heading "Sign in" [level=1] [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]:
            - generic [ref=e14]: Email
            - textbox "Email" [active] [ref=e16]:
              - /placeholder: Your email address
          - button "Continue" [ref=e17] [cursor=pointer]:
            - generic [ref=e18]: Continue
        - generic [ref=e19]: OR
        - generic [ref=e20]:
          - link "Continue with Google" [ref=e22] [cursor=pointer]:
            - /url: api/login?provider=GoogleOAuth&state=eyJyZXR1cm5QYXRobmFtZSI6Ii8ifQ%3D%3D&redirect_uri=https%3A%2F%2Ffinorg-app.vercel.app%2Fcallback&client_id=client_01KF10S8DY89001A0QTB7T6TSY&source=signin&authorization_session_id=01KK9J1D07TFYB1JPWV8SBA6PB
            - img [ref=e23]
            - generic [ref=e29]: Continue with Google
          - link "Continue with Apple" [ref=e31] [cursor=pointer]:
            - /url: api/login?provider=AppleOAuth&state=eyJyZXR1cm5QYXRobmFtZSI6Ii8ifQ%3D%3D&redirect_uri=https%3A%2F%2Ffinorg-app.vercel.app%2Fcallback&client_id=client_01KF10S8DY89001A0QTB7T6TSY&source=signin&authorization_session_id=01KK9J1D07TFYB1JPWV8SBA6PB
            - img [ref=e32]
            - generic [ref=e34]: Continue with Apple
      - paragraph [ref=e35]:
        - text: Don't have an account?
        - link "Sign up" [ref=e36] [cursor=pointer]:
          - /url: /sign-up?state=eyJyZXR1cm5QYXRobmFtZSI6Ii8ifQ%3D%3D&redirect_uri=https%3A%2F%2Ffinorg-app.vercel.app%2Fcallback&authorization_session_id=01KK9J1D07TFYB1JPWV8SBA6PB
  - alert [ref=e37]
```