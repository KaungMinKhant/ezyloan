def extract_features(transactions):
    if transactions is None or not isinstance(transactions, list):
        # Handle the case where transactions is None or not a list
        return {
            "num_transactions": 0,
            "total_value": 0,
            "avg_transaction_value": 0,
            "num_unique_addresses": 0
        }

    num_transactions = len(transactions)
    total_value = 0
    unique_addresses = set()
    transaction_amounts = []

    for transaction in transactions:
        # Check if transaction is valid
        if transaction is None or 'content' not in transaction or 'actual_instance' not in transaction.content:
            continue  # Skip invalid transaction

        actual_instance = transaction.content['actual_instance']

        # Check for 'value' in actual_instance
        if 'value' in actual_instance:
            try:
                value = int(actual_instance['value'])
            except (ValueError, TypeError):
                value = 0  # Default to 0 if conversion fails
        else:
            value = 0  # Default to 0 if 'value' is missing

        total_value += value
        transaction_amounts.append(value)

        # Check for address fields
        from_address = transaction.from_address_id
        to_address = transaction.to_address_id

        if from_address is not None:
            unique_addresses.add(from_address)
        if to_address is not None:
            unique_addresses.add(to_address)

        # Handle token transfers
        if 'token_transfers' in actual_instance:
            for transfer in actual_instance['token_transfers']:
                if 'value' in transfer:
                    try:
                        transfer_value = int(transfer['value'])
                    except (ValueError, TypeError):
                        transfer_value = 0  # Default to 0 if conversion fails
                else:
                    transfer_value = 0  # Default to 0 if 'value' is missing

                total_value += transfer_value
                transaction_amounts.append(transfer_value)

                from_address_transfer = transfer.get('from_address')
                to_address_transfer = transfer.get('to_address')

                if from_address_transfer is not None:
                    unique_addresses.add(from_address_transfer)
                if to_address_transfer is not None:
                    unique_addresses.add(to_address_transfer)

    avg_transaction_value = total_value / num_transactions if num_transactions > 0 else 0
    num_unique_addresses = len(unique_addresses)

    features = {
        "num_transactions": num_transactions,
        "total_value": total_value,
        "avg_transaction_value": avg_transaction_value,
        "num_unique_addresses": num_unique_addresses
    }

    return features