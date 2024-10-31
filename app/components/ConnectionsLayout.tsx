import {
    IndexTable,
    Card,
    useIndexResourceState,
    Text,
} from '@shopify/polaris';
import { Link } from '@remix-run/react';

import type { Connection } from '../types';
  
const ConnectionsLayout = ({ connections }: { connections: Connection[] }) => {
    const resourceName = {
      singular: 'connection',
      plural: 'connections',
    };
    const {selectedResources, allResourcesSelected, handleSelectionChange} =
      useIndexResourceState(connections.map(connection => ({...connection, id: connection.id.toString()})));
  
    const rowMarkup = connections.map(
      (
        {id, storeName, apiKey},
        index,
      ) => (
        <IndexTable.Row
          id={id.toString()}
          key={id.toString()}
          selected={selectedResources.includes(id.toString())}
          position={index}
        >
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold" as="span">
                <Link to={`connection/${id}`}>
                    {storeName}
                </Link>
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" alignment="end" numeric>
              {apiKey}
            </Text>
          </IndexTable.Cell>
        </IndexTable.Row>
      ),
    );
  
    return (
      <Card>
        <IndexTable
          resourceName={resourceName}
          itemCount={connections.length}
          selectedItemsCount={
              allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            {title: 'Store name'},
            {title: 'API key', alignment: 'end'},
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    );
  }

export { ConnectionsLayout };