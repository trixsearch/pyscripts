import React from 'react'

export const BULK_JOBS_TITLE = 'Create jobs in bulk'
export const BULK_CANDIDATES_TITLE = 'Create profiles in bulk'

export const CardComponent = ({
    name,
    count,
    title,
    name2,
    count2,
    count3,
    count4,
    type = 1, // types: 1, 2 or 3
    variant = 'small', // variants: small or big
    customClassNameForCount,
    customClassNameForCount2,
}) => {
    switch (type) {
        case 1:
            return (
                <div className={`stat-card1 ${variant}-card`}>
                    <span className={`card-count ${customClassNameForCount}`}>{count}</span>
                    <span className='card-name'>{name}</span>
                </div>
            )
        case 2:
            return (
                <div className={`stat-card2 ${variant}-card`}>
                    <span className='card-title stat-gray'>{title}</span>
                    <div>
                        <span className='card-name' id='card-name1'>{name}</span>
                        <div>
                            <span className={`card-count ${customClassNameForCount}`}>
                                {count}
                                &#47;
                            </span>
                            <span className='card-total-count stat-gray2'>{count3}</span>
                        </div>
                    </div>
                    <div>
                        <span className='card-name' id='card-name2'>{name2}</span>
                        <div>
                            <span className={`card-count ${customClassNameForCount2}`}>
                                {count2}
                                &#47;
                            </span>
                            <span className='card-total-count stat-gray2'>{count4}</span>
                        </div>
                    </div>
                </div>
            )
        case 3:
            return (
                <div className={`stat-card1 ${variant}-card`}>
                    <div>
                        <span className={`card-count ${customClassNameForCount}`}>
                            {count}
                            &#47;
                        </span>
                        <span className='card-total-count stat-gray2'>{count2}</span>
                    </div>
                    <span className='card-name'>{name}</span>
                </div>
            )
        case 4:
            return (
                <div className={`stat-card2 ${variant}-card`}>
                    <span className='card-title stat-gray'>{title}</span>
                    <div>
                        <span className='card-name' id='card-name1'>{name}</span>
                        <div>
                            <span className={`card-count ${customClassNameForCount}`}>
                                {count}
                            </span>
                        </div>
                    </div>
                    <div>
                        <span className='card-name' id='card-name2'>{name2}</span>
                        <div>
                            <span className={`card-count ${customClassNameForCount2}`}>
                                {count2}
                            </span>
                        </div>
                    </div>
                </div>
            )
        default:
            return null
    }
}
