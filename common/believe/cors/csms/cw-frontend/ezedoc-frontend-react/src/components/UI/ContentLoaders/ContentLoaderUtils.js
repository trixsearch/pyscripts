import React from 'react';
import ContentLoader from 'react-content-loader';

import { ContentLoadersDatas } from './ContentLoadersDatas';
import { isMobile } from '../../../containers/utils';

// DataSelector Function
export const DataSelector = (commonData, mobileData) => {
    return isMobile() && mobileData ? mobileData : commonData;
}

// Common Content Loader Template
export const ContentLoaderTemplate = ({data, mobileData}) => (
    <ContentLoader
        ariaLabel=""
        width={DataSelector(data.width, mobileData.width)}
        height={DataSelector(data.height, mobileData.height)}
        primaryColor={
            data.primaryColor || mobileData.primaryColor
                ? DataSelector(data.primaryColor, mobileData.primaryColor)
                : ContentLoadersDatas.CONTENT_LOADER_DEFAULTS.primaryColor
        }
        secondaryColor={
            data.secondaryColor || mobileData.secondaryColor
                ? DataSelector(data.secondaryColor, mobileData.secondaryColor)
                : ContentLoadersDatas.CONTENT_LOADER_DEFAULTS.secondaryColor
        }
        speed={data.speed || mobileData.speed
                ? DataSelector(data.speed, mobileData.speed)
                : ContentLoadersDatas.CONTENT_LOADER_DEFAULTS.speed
        }
    >
        {DataSelector(data.children, mobileData.children)}
    </ContentLoader>
)
