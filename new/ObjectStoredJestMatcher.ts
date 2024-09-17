declare global {
    namespace jest {
        interface Matchers<R> {
            toEqualIgnoringId(objectStored: any): R;
        }
    }
}

export function objectStoredJestMatcher() {
    function removeObjectStoredId(objectStored: any) {
        const clone = Object.assign({}, objectStored);
        clone.id = '0';
        return clone;
    }

    function compareWithoutId(expected: any, received: any) {
        return JSON.stringify(removeObjectStoredId(expected)) === JSON.stringify(removeObjectStoredId(received));
    }

    expect.extend({
        toEqualIgnoringId(received: any, expected: any) {
            const result = compareWithoutId(expected, received);
            return {
                message: () => `\nreceived: ${JSON.stringify(received)}\nexpected: ${JSON.stringify(expected)}`,
                pass: result
            }
        }
    })
}
