import { ForbiddenHttpError } from "../../httpCall/FrobiddenHttpError"
import { InternalErrorHttpError } from "../../httpCall/InternalErrorHttpError"
import { UnauthorizedHttpError } from "../../httpCall/UnauthorizedHttpError"
import { WassupUnknownUserError } from "../../wassup/WassupUnknownUserError"
import { ForbiddenUserContractError } from "./ForbiddenUserContractError"
import { ForbiddenUserTypeError } from "./ForbiddenUserTypeError"
import { MissingWassupCookieError } from "./MissingWassupCookieError"
import { TokenErrorsMapper } from "./TokenErrorsMapper"

describe("TokenErrorsMapper",()=>{

    let tokenErrorsMapper: TokenErrorsMapper

    beforeEach(()=>{
        tokenErrorsMapper = new TokenErrorsMapper();
    })

    test("returns UnauthorizedHttpError when domain error is WassupUnknownUserError",()=>{
        const domainError = new WassupUnknownUserError()

        const httpErr = tokenErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(UnauthorizedHttpError)
        expect(httpErr.mnemo).toEqual("WASSUP_ERROR_STATUS")
    })

    test("returns UnauthorizedHttpError when domain error is MissingWassupCookieError",()=>{
        const domainError = new MissingWassupCookieError()

        const httpErr = tokenErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(UnauthorizedHttpError)
        expect(httpErr.mnemo).toEqual("MISSING_WASSUP_COOKIE")
    })

    test("returns ForbiddenHttpError when domain error is ForbiddenUserTypeError",()=>{
        const domainError = new ForbiddenUserTypeError()

        const httpErr = tokenErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(ForbiddenHttpError)
        expect(httpErr.mnemo).toEqual("FORBIDDEN_USER_TYPE")
    })

    test("returns ForbiddenHttpError when domain error is ForbiddenUserContractError",()=>{
         const domainError = new ForbiddenUserContractError()

        const httpErr = tokenErrorsMapper.mapDomainErrorToHttpError(domainError)

        expect(httpErr).toBeInstanceOf(ForbiddenHttpError)
        expect(httpErr.mnemo).toEqual("FORBIDDEN_USER_CONTRACT")
    })

    test("returns InternalErrorHttpError when domain error is unkown",()=>{

        const httpErr = tokenErrorsMapper.mapDomainErrorToHttpError(new Error())

        expect(httpErr).toBeInstanceOf(InternalErrorHttpError)
    })

})
