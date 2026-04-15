import { useEffect, useRef } from 'react'

// usePrevious custom hook to get the previous value of the variable

function usePrevious(value) {
    const ref = useRef()
    useEffect(() => {
        ref.current = value
    })
    return ref.current
}

export default usePrevious