import { TokenServiceIdMismatchError } from "../Token/Errors/TokenServiceIdMismatchError"
import { BadRequestHttpError } from "../httpCall/BadRequestHttpError"
import { ForbiddenHttpError } from "../httpCall/FrobiddenHttpError"
import { InternalErrorHttpError } from "../httpCall/InternalErrorHttpError"
import { NotFoundHttpError } from "../httpCall/NotFoundHttpError"
import { UnauthorizedHttpError } from "../httpCall/UnauthorizedHttpError"
import { BadUserIdError } from "./Errors/BadUserIdError"
import { ForbiddenSauError } from "./Errors/ForbiddenSauError"
import { UserCreationError } from "./Errors/UserCreationError"
import { UserErrorMapper } from "./Errors/UserErrorMapper"
import { UserNotFoundInStorageWithIseError } from "./Errors/UserNotFoundInStorageWithIseError"
import {TokenErrorsMapper} from "../Token/Errors/TokenErrorsMapper";

describe("UserErrorMapper",()=>{
    let userErrorsMapper: UserErrorMapper

    beforeEach(()=>{
        userErrorsMapper = new UserErrorMapper();
    })

    test("returns ForbiddenHttpError when domain error is BadUserIdError",()=>{
        const domainError = new BadUserIdError()

        const httpErr = userErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(ForbiddenHttpError)
        expect(httpErr.mnemo).toEqual("BAD_USER_ID")
    })

    test("returns ForbiddenSauError when domain error is ForbiddenSauError",()=>{
        const domainError = new ForbiddenSauError()

        const httpErr = userErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(ForbiddenHttpError)
        expect(httpErr.mnemo).toEqual("FORBIDDEN_SAU")
    })

    test("returns NotFoundHttpError when domain error is UserNotFoundInStorageError",()=>{
        const domainError = new UserNotFoundInStorageWithIseError("test_ise")

        const httpErr = userErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(NotFoundHttpError)
        expect(httpErr.mnemo).toEqual("CHANGE_ME")
    })

    test("returns BadRequestHttpError when domain error is UserCreationError",()=>{
         const domainError = new UserCreationError("test_message")

        const httpErr = userErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(BadRequestHttpError)
        expect(httpErr.mnemo).toEqual("CHANGE_ME")
    })

    test("returns UnauthorizedHttpError when domain error is TokenServiceIdMismatchError",()=>{
         const domainError = new TokenServiceIdMismatchError()

        const httpErr = userErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(UnauthorizedHttpError)
        expect(httpErr.mnemo).toEqual("TOKEN_SERVICE_ID_MISMATCH")
    })

    test("returns InternalErrorHttpError when domain error is unkown",()=>{

        const httpErr = userErrorsMapper.mapDomainErrorToHttpError(new Error())

        expect(httpErr).toBeInstanceOf(InternalErrorHttpError)
    })

})
