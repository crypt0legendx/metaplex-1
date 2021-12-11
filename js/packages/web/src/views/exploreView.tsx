import React from "react";
import { Link } from "react-router-dom";

import { Button } from 'antd';
import {
  Box,
  Chip,
  Link as HyperLink,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stack,
} from "@mui/material";

import {
  Connection as RPCConnection,
  PublicKey,
} from "@solana/web3.js";

import {
  useConnectionConfig,
  shortenAddress,
} from '@oyster/common';

import {
  useLoading,
} from '../components/Loader';
import {
  CachedImageContent,
} from '../components/ArtContent';
import {
  Recipe,
  getEditionsRemaining,
  remainingText,
} from './fireballView';
import useWindowDimensions from '../utils/layout';
import {
  envFor,
} from '../utils/transactions';

export type RecipeLink = {
  image: string,
  name: string,
  mint?: PublicKey,
  link?: string,
};


export const ExploreView = (
  props: {
    recipeYields: Array<RecipeLink>,
  },
) => {
  const { endpoint } = useConnectionConfig();
  const connection = React.useMemo(
    () => new RPCConnection(endpoint.url, 'recent'),
    [endpoint]
  );

  const { loading, setLoading } = useLoading();

  const [editionsRemaining, setEditionsRemaining] = React.useState([]);

  React.useEffect(() => {
    if (!connection) return;
    setLoading(true);
    const wrap = async () => {
      try {
        setEditionsRemaining(await getEditionsRemaining( // TODO: dedup work?
          connection, props.recipeYields.map(c => c.mint).filter((c) : c is PublicKey => !!c)));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    wrap();
  }, [props]); // TODO: constrain?

  const explorerLinkForAddress = (key : PublicKey, shorten: boolean = true) => {
    return (
      <HyperLink
        href={`https://explorer.solana.com/address/${key.toBase58()}?cluster=${envFor(connection)}`}
        target="_blank"
        rel="noreferrer"
        title={key.toBase58()}
        underline="none"
        sx={{
          fontFamily: 'Monospace',
        }}
      >
        {shorten ? shortenAddress(key.toBase58()) : key.toBase58()}
      </HyperLink>
    );
  };

  // TODO: more robust
  const maxWidth = 960;
  const outerPadding = 96 * 2;
  const columnsGap = 40;
  const maxColumns = 3;
  const columnWidth = (maxWidth - columnsGap * (maxColumns - 1)) / maxColumns;

  const tilePadding = 0;
  const imageWidth = columnWidth - tilePadding * 2;

  const { width } = useWindowDimensions();
  const sizedColumns = (width : number) => {
           if (width > columnWidth * 3 + columnsGap * 2 + outerPadding) {
      return 3;
    } else if (width > columnWidth * 2 + columnsGap * 1 + outerPadding) {
      return 2;
    } else {
      return 1;
    }
  };
  const cols = sizedColumns(width);
  return (
    <Stack
      spacing={1}
      style={{
        ...(width >= maxWidth + outerPadding ? { width: maxWidth } : {}),
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <p className={"text-title"}>
        Explore Recipes
      </p>
      <p className={"text-subtitle"}>
        Recipes let you mix and match your current NFTs to craft new, rarer items.
      </p>
      <Box style={{ height: '20px' }} />
      <ImageList cols={cols} gap={columnsGap}>
        {props.recipeYields.map((r, idx) => {
          const yieldImage = (style) => (
            <CachedImageContent
              uri={r.image}
              preview={!!r.link}
              className={"fullAspectRatio"}
              style={{
                ...style,
              }}
            />
          );
          const remaining = r.mint ? editionsRemaining[r.mint.toBase58()] : null;
          return (
            <div
              key={idx}
              style={{
                minWidth: columnWidth,
              }}
            >
              <ImageListItem>
                {r.link
                  ? (
                    yieldImage({})
                  )
                  : (
                    <div>
                      {yieldImage({ filter: 'grayscale(100%)' })}
                    </div>
                  )
                }
                <ImageListItemBar
                  title={r.name}
                  subtitle={(
                    <div
                      style={{
                        paddingBottom: '10px',
                      }}
                    >
                      {r.mint
                        ? explorerLinkForAddress(r.mint)
                        : (
                          <p
                            style={{
                              fontSize: '12px',
                              fontFamily: 'Monospace',
                              color: '#b480eb',
                            }}
                          >
                            Coming Soon
                          </p>
                        )
                      }
                    </div>
                  )}
                  position="below"
                />
                <div>
                {remaining && (
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      marginTop: "-10px",
                      marginBottom: "10px",
                      color: "gray",
                      lineHeight: "normal",
                    }}
                  >
                    {remainingText({remaining}) /*expects a dict*/}
                  </p>
                )}
                </div>
                <span>
                <Button
                  style={{
                    borderRadius: "30px",
                    height: "35px",
                  }}
                >
                  {r.link && <Link
                    to={r.link}
                    style={{
                      color: 'inherit',
                      display: 'block',
                    }}
                  >
                    View Recipe
                  </Link>}
                </Button>
                </span>
              </ImageListItem>
            </div>
          );
        })}
      </ImageList>
    </Stack>
  );
}

