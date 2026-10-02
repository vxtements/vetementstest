import "@stdlib/ownable";

message SetOperator {
    operator: Address;
}

message Pause {
    paused: Bool;
}

message Collect {
    nft: Address;
    to: Address;
    responseTo: Address;
}

message NftTransfer {
    queryId: Int as uint64;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Cell?;
}

contract Operator with Ownable {
    owner: Address;
    operator: Address;
    paused: Bool;

    init(owner: Address, operator: Address) {
        self.owner = owner;
        self.operator = operator;
        self.paused = false;
    }

    receive(msg: SetOperator) {
        require(sender() == self.owner, "only owner");
        self.operator = msg.operator;
    }

    receive(msg: Pause) {
        require(sender() == self.owner, "only owner");
        self.paused = msg.paused;
    }

    receive(msg: Collect) {
        require(!self.paused, "paused");
        require(
            sender() == self.operator || sender() == self.owner,
            "not authorized"
        );

        send(SendParameters{
            to: msg.nft,
            value: ton("0.05"),
            bounce: true,
            body: NftTransfer{
                queryId: 0,
                newOwner: msg.to,
                responseDestination: msg.responseTo,
                customPayload: null,
                forwardAmount: ton("0.01"),
                forwardPayload: null
            }.toCell()
        });
    }

    receive() {}
}
